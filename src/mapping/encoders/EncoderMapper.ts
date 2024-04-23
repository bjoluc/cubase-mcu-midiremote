import { EncoderMappingDependencies, EncoderPage, EncoderPageConfig } from "./EncoderPage";
import { EncoderPageGroup } from "./EncoderPageGroup";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { Device, MainDevice } from "/devices";
import { SegmentDisplayManager } from "/midi/managers/SegmentDisplayManager";
import { GlobalState } from "/state";

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
  private readonly dependencies: EncoderMappingDependencies;

  constructor(
    page: MR_FactoryMappingPage,
    devices: Device[],
    mixerBankChannels: MR_MixerBankChannel[],
    segmentDisplayManager: SegmentDisplayManager,
    globalState: GlobalState,
  ) {
    const mainDevices = devices.filter((device) => device instanceof MainDevice) as MainDevice[];

    this.dependencies = {
      page,
      encoderSubPageArea: page.makeSubPageArea("Encoders"),
      mainDevices,
      deviceButtons: mainDevices.map(
        (device) => (device as MainDevice).controlSectionElements.buttons,
      ),
      channelElements: devices.flatMap((device) => device.channelElements),
      mixerBankChannels,
      channelTextManagers: devices.flatMap((device) => device.lcdManager.channelTextManagers),
      segmentDisplayManager,
      globalState,
    };
  }

  applyEncoderMappingConfigs(configs: EncoderMappingConfig[]) {
    for (const config of configs) {
      new EncoderPageGroup(this.dependencies, config);
    }
  }
}
