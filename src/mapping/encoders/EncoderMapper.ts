import { ChannelSurfaceElements, ControlSectionSurfaceElements } from "../../device-configs";
import { SegmentDisplayManager } from "../../midi/managers/SegmentDisplayManager";

import { DecoratedFactoryMappingPage } from "../../decorators/page";
import { Device, MainDevice } from "../../devices";
import { GlobalBooleanVariables } from "../../midi";
import { EncoderPage, EncoderPageConfig } from "./EncoderPage";

export class EncoderMapper {
  private readonly channelElements: ChannelSurfaceElements[];

  /** An array containing the control buttons of each main device */
  private readonly deviceButtons: ControlSectionSurfaceElements["buttons"][];

  private readonly subPageArea: MR_SubPageArea;
  private readonly shiftSubPageArea: MR_SubPageArea;

  constructor(
    private readonly page: DecoratedFactoryMappingPage,
    devices: Device[],
    private readonly mixerBankChannels: MR_MixerBankChannel[],
    private readonly segmentDisplayManager: SegmentDisplayManager,
    private readonly globalBooleanVariables: GlobalBooleanVariables
  ) {
    this.channelElements = devices.flatMap((device) => device.channelElements);
    this.deviceButtons = devices
      .filter((device) => device instanceof MainDevice)
      .map((device) => (device as MainDevice).controlSectionElements.buttons);
    this.subPageArea = page.makeSubPageArea("Encoders");
    this.shiftSubPageArea = page.makeSubPageArea("Encoders Shift");
  }

  /**
   * Takes an array of `EncoderPageConfig`s, splits all pages with more encoder assignments than
   * physical encoders into multiple pages and returns the resulting page config array.
   */
  private splitEncoderPageConfigs(pages: EncoderPageConfig[]) {
    const encoderPageSize = this.channelElements.length;

    return pages.flatMap((page) => {
      const assignments = page.assignments;
      if (Array.isArray(assignments) && assignments.length > encoderPageSize) {
        const chunks = [];
        for (let i = 0; i < assignments.length / encoderPageSize; i++) {
          chunks.push(assignments.slice(i * encoderPageSize, (i + 1) * encoderPageSize));
        }
        return chunks.map((chunk) => ({
          ...page,
          assignments: chunk,
        }));
      }

      return page;
    });
  }

  bindEncoderPagesToAssignButton(assignmentButtonIndex: number, pageConfigs: EncoderPageConfig[]) {
    pageConfigs = this.splitEncoderPageConfigs(pageConfigs);
    const pages = pageConfigs.map((pageConfig, pageIndex) => {
      return new EncoderPage(
        pageConfig,
        assignmentButtonIndex,
        pageIndex,
        pageConfigs.length,
        this.page,
        this.subPageArea,
        this.shiftSubPageArea,
        this.deviceButtons,
        this.channelElements,
        this.mixerBankChannels,
        this.segmentDisplayManager,
        this.globalBooleanVariables
      );
    });

    // Bind encoder assign buttons to cycle through sub pages in a round-robin fashion
    for (const buttons of this.deviceButtons) {
      const encoderAssignButtonValue = buttons.encoderAssign[assignmentButtonIndex].mSurfaceValue;
      this.page.makeActionBinding(
        encoderAssignButtonValue,
        pages[0].subPages.default.mAction.mActivate
      );

      let previousSubPages = pages[0].subPages;
      for (const { subPages: currentSubPages } of pages) {
        this.page
          .makeActionBinding(encoderAssignButtonValue, currentSubPages.default.mAction.mActivate)
          .setSubPage(previousSubPages.default);
        this.page
          .makeActionBinding(encoderAssignButtonValue, currentSubPages.default.mAction.mActivate)
          .setSubPage(previousSubPages.flip);

        previousSubPages = currentSubPages;
      }
    }

    return pages;
  }
}
