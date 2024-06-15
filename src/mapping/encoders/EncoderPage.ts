import { EncoderPageGroup } from "./EncoderPageGroup";
import { config } from "/config";
import { EncoderDisplayMode, LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { ChannelSurfaceElements, ControlSectionButtons } from "/device-configs";
import { MainDevice } from "/devices";
import { SegmentDisplayManager } from "/midi/managers/SegmentDisplayManager";
import { EncoderParameterNameBuilder } from "/midi/managers/lcd";
import { ChannelTextManager } from "/midi/managers/lcd/ChannelTextManager";
import { GlobalState } from "/state";
import { ContextVariable } from "/util";

export interface EncoderAssignmentConfig {
  encoderParameter?: MR_HostValue;

  /**
   * An optional function to customize the name displayed for the encoder's parameter based on its
   * `onTitleChange` parameters (`title1` and `title2`). The result of this function is abbreviated
   * if necessary and centered if applicable.
   */
  encoderParameterNameBuilder?: EncoderParameterNameBuilder;

  displayMode: EncoderDisplayMode;

  pushToggleParameter?: MR_HostValue;

  /**
   * An optional string to be displayed in front of push toggle parameter values to make them
   * distinguishable from encoder parameter values.
   */
  pushToggleParameterPrefix?: string;

  /**
   * A function that will be invoked when the encoder is pushed instead of toggling
   * `pushToggleValue`.
   */
  onPush?: (context: MR_ActiveDevice, encoder: LedPushEncoder) => void;

  /**
   * If specified, shift-pushing the encoder will set the encoder value to the provided number.
   */
  encoderParameterDefault?: number;

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

  /**
   * An optional function to add additional host mappings for the encoder page. It receives the
   * created {@link EncoderPage}, its {@link EncoderPageGroup}, and an
   * {@link EncoderMappingDependencies} object.
   */
  enhanceMapping?: (
    page: EncoderPage,
    pageGroup: EncoderPageGroup,
    mappingDependencies: EncoderMappingDependencies,
  ) => void;
}

interface SubPages {
  default: MR_SubPage;
  defaultShift: MR_SubPage;
  flip: MR_SubPage;
  flipShift: MR_SubPage;
}

export interface EncoderMappingDependencies {
  page: MR_FactoryMappingPage;
  encoderSubPageArea: MR_SubPageArea;

  mainDevices: MainDevice[];

  /** An array containing the control buttons of each main device */
  deviceButtons: ControlSectionButtons[];

  channelElements: ChannelSurfaceElements[];
  mixerBankChannels: MR_MixerBankChannel[];
  channelTextManagers: ChannelTextManager[];
  segmentDisplayManager: SegmentDisplayManager;
  globalState: GlobalState;
}

export class EncoderPage {
  private readonly assignments: EncoderAssignmentConfig[];
  private lastSubPageActivationTime = 0;

  public readonly subPages: SubPages;
  public readonly isActive = new ContextVariable(false);

  constructor(
    private readonly config: EncoderPageConfig,
    private readonly index: number,
    private readonly encoderPageGroup: EncoderPageGroup,
    private dependencies: EncoderMappingDependencies,
  ) {
    this.assignments = this.processAssignments(config.assignments);
    this.subPages = this.createSubPages();
    this.bindSubPages();
  }

  private processAssignments(
    assignmentConfigs: EncoderAssignmentConfigs,
  ): EncoderAssignmentConfig[] {
    const assignments =
      typeof assignmentConfigs === "function"
        ? this.dependencies.mixerBankChannels.map((channel, channelIndex) =>
            assignmentConfigs(channel, channelIndex),
          )
        : assignmentConfigs;

    for (const assignment of assignments) {
      if (assignment.onPush) {
        assignment.pushToggleParameter = undefined;
      }
    }

    return assignments;
  }

  private createSubPages(): SubPages {
    const subPageArea = this.dependencies.encoderSubPageArea;
    const subPageName = `${this.config.name} ${this.index + 1}`;

    const subPages: SubPages = {
      default: subPageArea.makeSubPage(subPageName),
      defaultShift: subPageArea.makeSubPage(`${subPageName} Shift`),
      flip: subPageArea.makeSubPage(`${subPageName} Flip`),
      flipShift: subPageArea.makeSubPage(`${subPageName} Flip Shift`),
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
    enhancer?: (binding: MR_ValueBinding) => void,
  ): MR_ValueBinding[] {
    const bindings = subPages.map((subPage) =>
      this.dependencies.page.makeValueBinding(surfaceValue, hostValue).setSubPage(subPage),
    );
    if (enhancer) {
      bindings.map(enhancer);
    }
    return bindings;
  }

  private bindSubPages() {
    for (const { flip: flipButton } of this.dependencies.deviceButtons) {
      this.dependencies.page
        .makeActionBinding(flipButton.mSurfaceValue, this.subPages.flip.mAction.mActivate)
        .setSubPage(this.subPages.default);
      this.dependencies.page
        .makeActionBinding(flipButton.mSurfaceValue, this.subPages.default.mAction.mActivate)
        .setSubPage(this.subPages.flip);
    }

    this.dependencies.globalState.isShiftModeActive.addOnChangeCallback(
      (context, isShiftModeActive, mapping) => {
        if (this.isActive.get(context)) {
          const isFlipModeActive = this.dependencies.globalState.isFlipModeActive.get(context);

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
      },
    );

    for (const [channelIndex, { encoder, fader }] of this.dependencies.channelElements.entries()) {
      const mSelected = this.dependencies.mixerBankChannels[channelIndex].mValue.mSelected;

      const {
        encoderParameter: encoderValue = this.dependencies.page.mCustom.makeHostValueVariable(
          "unassignedEncoderValue",
        ),
        pushToggleParameter: pushToggleValue = this.dependencies.page.mCustom.makeHostValueVariable(
          "unassignedEncoderPushValue",
        ),
        onPush: pushAction,
        encoderParameterDefault: encoderValueDefault,
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
          (binding) => binding.filterByValue(1),
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
        },
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
            binding.filterByValue(+this.config.areAssignmentsChannelRelated);
          },
        );
      }

      // Shift bindings
      this.makeMultiSubPageValueBinding(
        encoder.mPushValue,
        this.dependencies.page.mCustom.makeHostValueVariable("defaultShiftEncoderPushValue"),
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
        },
      );
    }
  }

  public enhanceMappingIfApplicable() {
    if (this.config.enhanceMapping) {
      this.config.enhanceMapping(this, this.encoderPageGroup, this.dependencies);
    }
  }

  public onActivated(context: MR_ActiveDevice) {
    this.isActive.set(context, true);

    const numberOfPages = this.encoderPageGroup.numberOfPages;
    const assignment =
      numberOfPages === 1
        ? "  "
        : numberOfPages < 10
          ? `${this.index + 1}.${numberOfPages}`
          : (this.index + 1).toString().padStart(2, " ");

    this.dependencies.segmentDisplayManager.setAssignment(context, assignment);

    for (const [encoderIndex, { encoder }] of this.dependencies.channelElements.entries()) {
      const assignment = this.assignments[encoderIndex] as EncoderAssignmentConfig | undefined;
      encoder.displayMode.set(context, assignment?.displayMode ?? EncoderDisplayMode.SingleDot);

      const channelTextManager = this.dependencies.channelTextManagers[encoderIndex];
      channelTextManager.setParameterNameBuilder(assignment?.encoderParameterNameBuilder);
      channelTextManager.setPushParameterValuePrefix(assignment?.pushToggleParameterPrefix);
    }

    this.dependencies.globalState.isValueDisplayModeActive.set(context, false);
  }

  public onDeactivated(context: MR_ActiveDevice) {
    this.isActive.set(context, false);
  }

  private onSubPageActivated(flip: boolean, shift: boolean, context: MR_ActiveDevice) {
    this.lastSubPageActivationTime = performance.now();

    this.encoderPageGroup.onEncoderPageSubPageActivated(context, this);

    if (this.dependencies.globalState.isFlipModeActive.get(context) !== flip) {
      this.dependencies.globalState.isFlipModeActive.set(context, flip);
    }

    if (shift) {
      // On shift sub pages, all encoder push values are bound to "undefined host values" and thus
      // keep whatever state they had in the previous binding, hence resetting them here to reliably
      // detect pushes via `mOnProcessValueChange`:
      for (const { encoder } of this.dependencies.channelElements) {
        encoder.mPushValue.setProcessValue(context, 0);
      }
    } else {
      // If some encoder push values are bound to "undefined host values", reset them too:
      for (const [channelIndex, { encoder }] of this.dependencies.channelElements.entries()) {
        if (
          channelIndex < this.assignments.length &&
          !this.assignments[channelIndex].pushToggleParameter
        ) {
          encoder.mPushValue.setProcessValue(context, 0);
        }
      }
    }
  }
}
