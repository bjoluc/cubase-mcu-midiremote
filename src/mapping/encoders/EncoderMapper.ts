import { EncoderPage, EncoderPageConfig } from "./EncoderPage";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { ChannelSurfaceElements, ControlSectionSurfaceElements } from "/device-configs";
import { Device, MainDevice } from "/devices";
import { SegmentDisplayManager } from "/midi/managers/SegmentDisplayManager";
import { ChannelTextManager } from "/midi/managers/lcd/ChannelTextManager";
import { GlobalState } from "/state";
import { ContextVariable } from "/util";

/**
 * The configuration object for an encoder mapping. An encoder mapping maps a number of encoder
 * pages to a specified button.
 */
export interface EncoderMappingConfig {
  /**
   * A function that – given a `MainDevice` – returns the device's button that will be mapped to the
   * provided encoder pages.
   */
  activatorButtonSelector: (device: MainDevice) => LedButton;

  pages: EncoderPageConfig[];

  /**
   * An optional function that receives the created {@link EncoderPage} objects and an array with
   * each device's activator button. It can be used to add additional host mappings.
   */
  enhanceMapping?: (pages: EncoderPage[], activatorButtons: LedButton[]) => void;
}

export class EncoderMapper {
  private readonly channelElements: ChannelSurfaceElements[];
  private readonly channelTextManagers: ChannelTextManager[];

  /** An array containing the control buttons of each main device */
  private readonly deviceButtons: ControlSectionSurfaceElements["buttons"][];

  private readonly mainDevices: MainDevice[];

  private readonly subPageArea: MR_SubPageArea;

  private activeEncoderPage = new ContextVariable<EncoderPage | undefined>(undefined);

  constructor(
    private readonly page: MR_FactoryMappingPage,
    devices: Device[],
    private readonly mixerBankChannels: MR_MixerBankChannel[],
    private readonly segmentDisplayManager: SegmentDisplayManager,
    private readonly globalState: GlobalState,
  ) {
    this.channelElements = devices.flatMap((device) => device.channelElements);
    this.channelTextManagers = devices.flatMap((device) => device.lcdManager.channelTextManagers);
    this.mainDevices = devices.filter((device) => device instanceof MainDevice) as MainDevice[];
    this.deviceButtons = this.mainDevices.map(
      (device) => (device as MainDevice).controlSectionElements.buttons,
    );

    this.subPageArea = page.makeSubPageArea("Encoders");
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

  private bindEncoderPagesToAssignButton(
    activatorButtons: LedButton[],
    pageConfigs: EncoderPageConfig[],
  ) {
    pageConfigs = this.splitEncoderPageConfigs(pageConfigs);
    const pages = pageConfigs.map((pageConfig, pageIndex) => {
      return new EncoderPage(
        this,
        pageConfig,
        activatorButtons,
        pageIndex,
        pageConfigs.length,
        this.page,
        this.subPageArea,
        this.deviceButtons,
        this.channelElements,
        this.mixerBankChannels,
        this.channelTextManagers,
        this.segmentDisplayManager,
        this.globalState,
      );
    });

    // Bind encoder assign buttons to cycle through sub pages in a round-robin fashion
    for (const activatorButton of activatorButtons) {
      const activatorButtonValue = activatorButton.mSurfaceValue;
      this.page.makeActionBinding(
        activatorButtonValue,
        pages[0].subPages.default.mAction.mActivate,
      );

      let previousSubPages = pages[0].subPages;
      for (const { subPages: currentSubPages } of pages) {
        this.page
          .makeActionBinding(activatorButtonValue, currentSubPages.default.mAction.mActivate)
          .setSubPage(previousSubPages.default);
        this.page
          .makeActionBinding(activatorButtonValue, currentSubPages.default.mAction.mActivate)
          .setSubPage(previousSubPages.flip);

        previousSubPages = currentSubPages;
      }
    }

    return pages;
  }

  applyEncoderMappingConfigs(configs: EncoderMappingConfig[]) {
    for (const mappingConfig of configs) {
      const activatorButtons = this.mainDevices.map(mappingConfig.activatorButtonSelector);
      const encoderPages = this.bindEncoderPagesToAssignButton(
        activatorButtons,
        mappingConfig.pages,
      );

      if (mappingConfig.enhanceMapping) {
        mappingConfig.enhanceMapping(encoderPages, activatorButtons);
      }
    }
  }

  /**
   * This is invoked by an {@link EncoderPage} when one of its subpages gets activated. It keeps
   * track of the currently active `EncoderPage` and runs the {@link EncoderPage.onActivated()} and
   * {@link EncoderPage.onDeactivated()} callbacks.
   */
  onEncoderPageSubPageActivated(context: MR_ActiveDevice, encoderPage: EncoderPage) {
    const lastActiveEncoderPage = this.activeEncoderPage.get(context);
    if (lastActiveEncoderPage !== encoderPage) {
      lastActiveEncoderPage?.onDeactivated(context);
      this.activeEncoderPage.set(context, encoderPage);
      encoderPage.onActivated(context);
    }
  }
}
