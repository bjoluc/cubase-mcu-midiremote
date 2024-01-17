import {
  ChannelSurfaceElements,
  ControlSectionSurfaceElements,
  DeviceSurface,
} from "./device-configs";
import { config, deviceConfig } from "/config";
import { MidiPortPair } from "/midi/MidiPortPair";
import { ColorManager } from "/midi/managers/ColorManager";
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

    if (DEVICE_NAME === "X-Touch") {
      this.colorManager = new ColorManager(this);
    }
  }
}

export class MainDevice extends Device {
  controlSectionElements: ControlSectionSurfaceElements;

  constructor(
    driver: MR_DeviceDriver,
    surface: MR_DeviceSurface,
    globalState: GlobalState,
    timerUtils: TimerUtils,
    firstChannelIndex: number,
    surfaceXPosition: number,
  ) {
    const deviceSurface = deviceConfig.createMainSurface(surface, surfaceXPosition);
    super(driver, firstChannelIndex, deviceSurface, globalState, timerUtils, false);

    this.controlSectionElements = deviceSurface.controlSectionElements!;
  }
}

export class ExtenderDevice extends Device {
  constructor(
    driver: MR_DeviceDriver,
    surface: MR_DeviceSurface,
    globalState: GlobalState,
    timerUtils: TimerUtils,
    firstChannelIndex: number,
    surfaceXPosition: number,
  ) {
    const deviceSurface = deviceConfig.createExtenderSurface(surface, surfaceXPosition);
    super(driver, firstChannelIndex, deviceSurface, globalState, timerUtils, true);
  }
}

export function createDevices(
  driver: MR_DeviceDriver,
  surface: MR_DeviceSurface,
  globalState: GlobalState,
  timerUtils: TimerUtils,
): Array<MainDevice | ExtenderDevice> {
  let nextDeviceXPosition = 0;

  const devices = config.devices.map((deviceType, deviceIndex) => {
    const device = new (deviceType === "main" ? MainDevice : ExtenderDevice)(
      driver,
      surface,
      globalState,
      timerUtils,
      deviceIndex * 8,
      nextDeviceXPosition,
    ) as MainDevice | ExtenderDevice;

    nextDeviceXPosition += device.surfaceWidth;

    return device;
  });

  if (
    devices.length === 1 ||
    (devices.length === 2 && devices[0].constructor.name !== devices[1].constructor.name)
  ) {
    for (const detectionUnitConfig of deviceConfig.detectionUnits) {
      const detectionUnit = driver.makeDetectionUnit();
      for (const device of devices) {
        const detectionUnitConfigurator =
          detectionUnitConfig[device instanceof MainDevice ? "main" : "extender"];
        detectionUnitConfigurator(
          detectionUnit.detectPortPair(device.ports.input, device.ports.output),
        );
      }
    }
  }

  return devices;
}
