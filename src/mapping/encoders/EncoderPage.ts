import { config } from "../../config";
import { DecoratedFactoryMappingPage } from "../../decorators/page";
import { ChannelSurfaceElements, ControlSectionButtons } from "../../device-configs";
import { EncoderDisplayMode, GlobalBooleanVariables } from "../../midi";
import { SegmentDisplayManager } from "../../midi/managers/SegmentDisplayManager";

export interface EncoderAssignmentConfig {
  encoderValue: MR_HostValue;
  displayMode: EncoderDisplayMode;
  pushToggleValue?: MR_HostValue;
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
}

export class EncoderPage implements EncoderPageConfig {
  public readonly subPages: SubPages;
  public readonly name: string;
  public readonly assignments: EncoderAssignmentConfig[];
  public readonly areAssignmentsChannelRelated: boolean;

  constructor(
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

    this.subPages = this.createSubPages();
    this.bindSubPages();
  }

  private createSubPages(): SubPages {
    const subPageName = `${this.name} ${this.index + 1}`;

    const defaultSubPage = this.subPageArea.makeSubPage(subPageName);
    const flipSubPage = this.subPageArea.makeSubPage(`${subPageName} Flip`);

    defaultSubPage.mOnActivate = this.onDefaultSubPageActivated.bind(this);
    flipSubPage.mOnActivate = this.onFlipSubPageActivated.bind(this);

    return { default: defaultSubPage, flip: flipSubPage };
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

    for (const [channelIndex, { encoder, fader }] of this.channelElements.entries()) {
      const mSelected = this.mixerBankChannels[channelIndex].mValue.mSelected;

      const {
        encoderValue = this.page.mCustom.makeHostValueVariable("unassignedEncoderValue"),
        pushToggleValue = this.page.mCustom.makeHostValueVariable("unassignedEncoderPushValue"),
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
    }
  }

  private onDefaultSubPageActivated(context: MR_ActiveDevice) {
    const encoderPage = this;
    this.segmentDisplayManager.setAssignment(
      context,
      encoderPage.pagesCount === 1 ? "  " : `${encoderPage.index + 1}.${encoderPage.pagesCount}`
    );

    for (const [
      assignmentId,
      isActive,
    ] of this.globalBooleanVariables.isEncoderAssignmentActive.entries()) {
      isActive.set(context, encoderPage.assignmentButtonIndex === assignmentId);
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
    this.globalBooleanVariables.isFlipModeActive.set(context, true);
  }
}
