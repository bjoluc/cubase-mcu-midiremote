import { LedPushEncoder } from "src/decorators/surface";
import { config } from "../../config";
import { DecoratedFactoryMappingPage } from "../../decorators/page";
import { ChannelSurfaceElements, ControlSectionButtons } from "../../device-configs";
import { EncoderDisplayMode, GlobalBooleanVariables } from "../../midi";
import { SegmentDisplayManager } from "../../midi/managers/SegmentDisplayManager";

export interface EncoderAssignmentConfig {
  encoderValue: MR_HostValue;
  displayMode: EncoderDisplayMode;
  pushToggleValue?: MR_HostValue;

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
  flip: MR_SubPage;
  noShift: MR_SubPage;
  shift: MR_SubPage;
}

export class EncoderPage implements EncoderPageConfig {
  public readonly subPages: SubPages;
  public readonly name: string;
  public readonly assignments: EncoderAssignmentConfig[];
  public readonly areAssignmentsChannelRelated: boolean;

  private isActive = false;
  private areShiftEncoderValuesReset = false;

  constructor(
    pageConfig: EncoderPageConfig,
    public readonly assignmentButtonIndex: number,
    public readonly index: number,
    public readonly pagesCount: number,

    private readonly page: DecoratedFactoryMappingPage,
    private readonly subPageArea: MR_SubPageArea,
    private readonly shiftSubPageArea: MR_SubPageArea,
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

    this.subPages = this.createSubPages();
    this.bindSubPages();
  }

  private createSubPages(): SubPages {
    const subPageName = `${this.name} ${this.index + 1}`;

    const subPages: SubPages = {
      default: this.subPageArea.makeSubPage(subPageName),
      flip: this.subPageArea.makeSubPage(`${subPageName} Flip`),
      noShift: this.shiftSubPageArea.makeSubPage(`${subPageName} No Shift`),
      shift: this.shiftSubPageArea.makeSubPage(`${subPageName} Shift`),
    };

    const onDeactivate = () => {
      this.isActive = false;
    };

    subPages.default.mOnActivate = this.onDefaultSubPageActivated.bind(this);
    subPages.default.mOnDeactivate = onDeactivate;

    subPages.flip.mOnActivate = this.onFlipSubPageActivated.bind(this);
    subPages.flip.mOnDeactivate = onDeactivate;

    subPages.shift.mOnActivate = (context) => {
      // The encoder values keep whatever state they had in the previous binding, hence
      // resetting them here to reliably detect pushes via mOnProcessValueChange:
      for (const { encoder } of this.channelElements) {
        encoder.mPushValue.setProcessValue(context, 0);
      }

      this.areShiftEncoderValuesReset = true;
    };

    subPages.shift.mOnDeactivate = (context) => {
      this.areShiftEncoderValuesReset = false;
    };

    return subPages;
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
      (_context, isShiftModeActive, mapping) => {
        if (this.isActive) {
          (isShiftModeActive
            ? this.subPages.shift
            : this.subPages.noShift
          ).mAction.mActivate.trigger(mapping);
        }
      }
    );

    for (const [channelIndex, { encoder, fader }] of this.channelElements.entries()) {
      const mSelected = this.mixerBankChannels[channelIndex].mValue.mSelected;

      const {
        encoderValue = this.page.mCustom.makeHostValueVariable("unassignedEncoderValue"),
        pushToggleValue = this.page.mCustom.makeHostValueVariable("unassignedEncoderPushValue"),
        encoderValueDefault,
        onShiftPush: shiftPushAction,
      } = this.assignments[channelIndex] ?? {};

      // Default bindings
      this.page
        .makeValueBinding(encoder.mEncoderValue, encoderValue)
        .setSubPage(this.subPages.default);
      if (config.enableAutoSelect) {
        this.page
          .makeValueBinding(fader.mTouchedValue, mSelected)
          .filterByValue(1)
          .setSubPage(this.subPages.default);
      }

      if (pushToggleValue) {
        this.page
          .makeValueBinding(encoder.mPushValue, pushToggleValue)
          .setTypeToggle()
          .setSubPage(this.subPages.default);
        this.page
          .makeValueBinding(encoder.mPushValue, pushToggleValue)
          .setTypeToggle()
          .setSubPage(this.subPages.flip);
      }

      // Flip bindings
      this.page.makeValueBinding(fader.mSurfaceValue, encoderValue).setSubPage(this.subPages.flip);
      if (config.enableAutoSelect) {
        this.page
          .makeValueBinding(fader.mTouchedValue, mSelected)
          // Don't select mixer channels on touch when a fader's value does not belong to its
          // mixer channel
          .filterByValue(+this.areAssignmentsChannelRelated)
          .setSubPage(this.subPages.flip);
      }

      // Shift bindings
      const shiftBinding = this.page
        .makeValueBinding(
          encoder.mPushValue,
          this.page.mCustom.makeHostValueVariable("shiftEncoderPushValue")
        )
        .setSubPage(this.subPages.shift);

      if (shiftPushAction || typeof encoderValueDefault !== "undefined") {
        shiftBinding.mOnValueChange = (context, _mapping, value) => {
          if (this.areShiftEncoderValuesReset && value) {
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
  }

  private onDefaultSubPageActivated(context: MR_ActiveDevice) {
    this.isActive = true;

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
    this.globalBooleanVariables.isFlipModeActive.set(context, false);
    this.globalBooleanVariables.isValueDisplayModeActive.set(context, false);

    for (const [encoderIndex, { encoder }] of this.channelElements.entries()) {
      encoder.mDisplayModeValue.setProcessValue(
        context,
        this.assignments[encoderIndex]?.displayMode ?? EncoderDisplayMode.SingleDot
      );
    }
  }

  private onFlipSubPageActivated(context: MR_ActiveDevice) {
    this.isActive = true;

    this.globalBooleanVariables.isFlipModeActive.set(context, true);
  }
}
