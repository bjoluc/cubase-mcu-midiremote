import { LedPushEncoder } from "src/decorators/surface";
import { config } from "../../config";
import { DecoratedFactoryMappingPage } from "../../decorators/page";
import { ChannelSurfaceElements, ControlSectionButtons } from "../../device-configs";
import { EncoderDisplayMode, GlobalBooleanVariables } from "../../midi";
import { SegmentDisplayManager } from "../../midi/managers/SegmentDisplayManager";
import type { EncoderMapper } from "./EncoderMapper";

export interface EncoderAssignmentConfig {
  encoderValue?: MR_HostValue;
  displayMode: EncoderDisplayMode;
  pushToggleValue?: MR_HostValue;

  /**
   * A function that will be invoked when the encoder is pushed instead of toggling
   * `pushToggleValue`.
   */
  onPush?: (context: MR_ActiveDevice, encoder: LedPushEncoder) => void;

  /**
   * If specified, shift-pushing the encoder will set the encoder value to the provided number.
   */
  encoderValueDefault?: number;

  /**
   * A function that will be invoked when the encoder is shift-pushed.
   */
  onShiftPush?: (context: MR_ActiveDevice, encoder: LedPushEncoder) => void;
}

export type EncoderAssignmentConfigs =
  | EncoderAssignmentConfig[]
  | ((channel: MR_MixerBankChannel, channelIndex: number) => EncoderAssignmentConfig);

export interface EncoderPageConfig {
  name: string;
  assignments: EncoderAssignmentConfigs;
  areAssignmentsChannelRelated: boolean;
}

interface SubPages {
  default: MR_SubPage;
  defaultShift: MR_SubPage;
  flip: MR_SubPage;
  flipShift: MR_SubPage;
}

export class EncoderPage implements EncoderPageConfig {
  public readonly subPages: SubPages;
  public readonly name: string;
  public readonly assignments: EncoderAssignmentConfig[];
  public readonly areAssignmentsChannelRelated: boolean;

  private lastSubPageActivationTime = 0;

  constructor(
    private readonly encoderMapper: EncoderMapper,
    pageConfig: EncoderPageConfig,
    public readonly assignmentButtonIndex: number,
    public readonly index: number,
    public readonly pagesCount: number,

    private readonly page: DecoratedFactoryMappingPage,
    private readonly subPageArea: MR_SubPageArea,
    private readonly deviceButtons: ControlSectionButtons[],
    private readonly channelElements: ChannelSurfaceElements[],
    private readonly mixerBankChannels: MR_MixerBankChannel[],
    private readonly segmentDisplayManager: SegmentDisplayManager,
    private readonly globalBooleanVariables: GlobalBooleanVariables
  ) {
    this.name = pageConfig.name;
    this.areAssignmentsChannelRelated = pageConfig.areAssignmentsChannelRelated;

    const assignmentsConfig = pageConfig.assignments;
    this.assignments =
      typeof assignmentsConfig === "function"
        ? mixerBankChannels.map((channel, channelIndex) => assignmentsConfig(channel, channelIndex))
        : assignmentsConfig;

    for (const assignment of this.assignments) {
      if (assignment.onPush) {
        assignment.pushToggleValue = undefined;
      }
    }

    this.subPages = this.createSubPages();
    this.bindSubPages();
  }

  private createSubPages(): SubPages {
    const subPageName = `${this.name} ${this.index + 1}`;

    const subPages: SubPages = {
      default: this.subPageArea.makeSubPage(subPageName),
      defaultShift: this.subPageArea.makeSubPage(`${subPageName} Shift`),
      flip: this.subPageArea.makeSubPage(`${subPageName} Flip`),
      flipShift: this.subPageArea.makeSubPage(`${subPageName} Flip Shift`),
    };

    subPages.default.mOnActivate = this.onSubPageActivated.bind(this, false, false);
    subPages.defaultShift.mOnActivate = this.onSubPageActivated.bind(this, false, true);
    subPages.flip.mOnActivate = this.onSubPageActivated.bind(this, true, false);
    subPages.flipShift.mOnActivate = this.onSubPageActivated.bind(this, true, true);

    return subPages;
  }

  private makeMultiSubPageValueBinding(
    surfaceValue: MR_SurfaceValue,
    hostValue: MR_HostValue,
    subPages: MR_SubPage[],
    enhancer?: (binding: MR_ValueBinding) => void
  ): MR_ValueBinding[] {
    const bindings = subPages.map((subPage) =>
      this.page.makeValueBinding(surfaceValue, hostValue).setSubPage(subPage)
    );
    if (enhancer) {
      bindings.map(enhancer);
    }
    return bindings;
  }

  private bindSubPages() {
    for (const { flip: flipButton } of this.deviceButtons) {
      this.page
        .makeActionBinding(flipButton.mSurfaceValue, this.subPages.flip.mAction.mActivate)
        .setSubPage(this.subPages.default);
      this.page
        .makeActionBinding(flipButton.mSurfaceValue, this.subPages.default.mAction.mActivate)
        .setSubPage(this.subPages.flip);
    }

    this.globalBooleanVariables.isShiftModeActive.addOnChangeCallback(
      (context, isShiftModeActive, mapping) => {
        if (this.isActive()) {
          const isFlipModeActive = this.globalBooleanVariables.isFlipModeActive.get(context);

          const nextSubPage = [
            // Flip mode inactive
            [
              this.subPages.default, // Shift mode inactive
              this.subPages.defaultShift, // Shift mode active
            ],
            // Flip mode active
            [
              this.subPages.flip, // Shift mode inactive
              this.subPages.flipShift, // Shift mode active
            ],
          ][+isFlipModeActive][+isShiftModeActive];

          nextSubPage.mAction.mActivate.trigger(mapping);
        }
      }
    );

    for (const [channelIndex, { encoder, fader }] of this.channelElements.entries()) {
      const mSelected = this.mixerBankChannels[channelIndex].mValue.mSelected;

      const {
        encoderValue = this.page.mCustom.makeHostValueVariable("unassignedEncoderValue"),
        pushToggleValue = this.page.mCustom.makeHostValueVariable("unassignedEncoderPushValue"),
        onPush: pushAction,
        encoderValueDefault,
        onShiftPush: shiftPushAction,
      } = this.assignments[channelIndex] ?? {};

      // Default bindings
      this.makeMultiSubPageValueBinding(encoder.mEncoderValue, encoderValue, [
        this.subPages.default,
        this.subPages.defaultShift,
      ]);

      if (config.enableAutoSelect) {
        this.makeMultiSubPageValueBinding(
          fader.mTouchedValue,
          mSelected,
          [this.subPages.default, this.subPages.defaultShift],
          (binding) => binding.filterByValue(1)
        );
      }

      this.makeMultiSubPageValueBinding(
        encoder.mPushValue,
        pushToggleValue,
        [this.subPages.default, this.subPages.flip],
        (binding) => {
          if (pushAction) {
            binding.mOnValueChange = (context, _mapping, value) => {
              // Ignore value changes that were caused by switching sub pages. The idea is that
              // those value changes always occur a short time after a sub page was activated. 250ms
              // should do.
              if (this.lastSubPageActivationTime < performance.now() - 250 && value) {
                pushAction(context, encoder);
              }
            };
          } else {
            binding.setTypeToggle();
          }
        }
      );

      // Flip bindings
      this.makeMultiSubPageValueBinding(fader.mSurfaceValue, encoderValue, [
        this.subPages.flip,
        this.subPages.flipShift,
      ]);
      if (config.enableAutoSelect) {
        this.makeMultiSubPageValueBinding(
          fader.mTouchedValue,
          mSelected,
          [this.subPages.flip, this.subPages.flipShift],
          (binding) => {
            // Don't select mixer channels on touch when a fader's value does not belong to its
            // mixer channel
            binding.filterByValue(+this.areAssignmentsChannelRelated);
          }
        );
      }

      // Shift bindings
      this.makeMultiSubPageValueBinding(
        encoder.mPushValue,
        this.page.mCustom.makeHostValueVariable("defaultShiftEncoderPushValue"),
        [this.subPages.defaultShift, this.subPages.flipShift],
        (binding) => {
          if (shiftPushAction || typeof encoderValueDefault !== "undefined") {
            binding.mOnValueChange = (context, _mapping, value) => {
              if (value) {
                if (typeof encoderValueDefault !== "undefined") {
                  encoder.mEncoderValue.setProcessValue(context, encoderValueDefault);
                }
                if (shiftPushAction) {
                  shiftPushAction(context, encoder);
                }
              }
            };
          }
        }
      );
    }
  }

  private onActivated(context: MR_ActiveDevice) {
    this.segmentDisplayManager.setAssignment(
      context,
      this.pagesCount === 1 ? "  " : `${this.index + 1}.${this.pagesCount}`
    );

    for (const [
      assignmentId,
      isActive,
    ] of this.globalBooleanVariables.isEncoderAssignmentActive.entries()) {
      isActive.set(context, this.assignmentButtonIndex === assignmentId);
    }

    for (const [encoderIndex, { encoder }] of this.channelElements.entries()) {
      encoder.mDisplayModeValue.setProcessValue(
        context,
        this.assignments[encoderIndex]?.displayMode ?? EncoderDisplayMode.SingleDot
      );
    }

    this.globalBooleanVariables.isValueDisplayModeActive.set(context, false);
  }

  private isActive() {
    return this.encoderMapper.activeEncoderPage === this;
  }

  private onSubPageActivated(flip: boolean, shift: boolean, context: MR_ActiveDevice) {
    this.lastSubPageActivationTime = performance.now();

    if (!this.isActive()) {
      this.encoderMapper.activeEncoderPage = this;
      this.onActivated(context);
    }

    if (this.globalBooleanVariables.isFlipModeActive.get(context) !== flip) {
      this.globalBooleanVariables.isFlipModeActive.set(context, flip);
    }

    if (shift) {
      // On shift sub pages, all encoder push values are bound to "undefined host values" and thus
      // keep whatever state they had in the previous binding, hence resetting them here to reliably
      // detect pushes via `mOnProcessValueChange`:
      for (const { encoder } of this.channelElements) {
        encoder.mPushValue.setProcessValue(context, 0);
      }
    } else {
      // If some encoder push values are bound to "undefined host values", reset them too:
      for (const [channelIndex, { encoder }] of this.channelElements.entries()) {
        if (
          channelIndex < this.assignments.length &&
          !this.assignments[channelIndex].pushToggleValue
        ) {
          encoder.mPushValue.setProcessValue(context, 0);
        }
      }
    }
  }
}
