import { ChannelSurfaceElements, DeviceSurface } from "../device-configs";
import { deviceConfig } from "/config";
import { MidiPortPair } from "/midi/MidiPortPair";
import { ColorManager } from "/midi/managers/colors/ColorManager";
import { LcdManager } from "/midi/managers/lcd";
import { GlobalState } from "/state";
import { TimerUtils } from "/util";

/**
 * A `Device` represents a physical device and manages its MIDI ports and surface elements
 */
export abstract class Device {
  surfaceWidth: number;
  channelElements: ChannelSurfaceElements[];

  ports: MidiPortPair;
  lcdManager: LcdManager;
  colorManager?: ColorManager;

  constructor(
    driver: MR_DeviceDriver,
    public firstChannelIndex: number,
    deviceSurface: DeviceSurface,
    globalState: GlobalState,
    timerUtils: TimerUtils,
    isExtender: boolean,
  ) {
    this.surfaceWidth = deviceSurface.width;
    this.channelElements = deviceSurface.channelElements;

    this.ports = new MidiPortPair(driver, isExtender);
    this.lcdManager = new LcdManager(this, globalState, timerUtils);

    if (deviceConfig.colorManager) {
      this.colorManager = new deviceConfig.colorManager(this);
    }
  }
}
