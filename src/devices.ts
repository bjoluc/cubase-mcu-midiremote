import { config, deviceConfig } from "./config";
import { DecoratedDeviceSurface } from "./decorators/surface";
import {
  ChannelSurfaceElements,
  ControlSectionSurfaceElements,
  DeviceSurface,
} from "./device-configs";
import { ColorManager } from "./midi/managers/ColorManager";
import { LcdManager } from "./midi/managers/LcdManager";
import { makePortPair, PortPair } from "./midi/PortPair";

/**
 * A `Device` represents a physical device and manages its MIDI ports and surface elements
 */
export abstract class Device {
  surfaceWidth: number;
  channelElements: ChannelSurfaceElements[];

  ports: PortPair;
  lcdManager: LcdManager;
  colorManager?: ColorManager;

  constructor(
    driver: MR_DeviceDriver,
    public firstChannelIndex: number,
    deviceSurface: DeviceSurface,
    isExtender: boolean
  ) {
    this.surfaceWidth = deviceSurface.width;
    this.channelElements = deviceSurface.channelElements;

    this.ports = makePortPair(driver, isExtender);
    this.lcdManager = new LcdManager(this);

    if (DEVICE_NAME === "X-Touch") {
      this.colorManager = new ColorManager(this);
    }
  }
}

export class MainDevice extends Device {
  controlSectionElements: ControlSectionSurfaceElements;

  constructor(
    driver: MR_DeviceDriver,
    surface: DecoratedDeviceSurface,
    firstChannelIndex: number,
    surfaceXPosition: number
  ) {
    const deviceSurface = deviceConfig.createMainSurface(surface, surfaceXPosition);
    super(driver, firstChannelIndex, deviceSurface, false);

    this.controlSectionElements = deviceSurface.controlSectionElements!;
  }
}

export class ExtenderDevice extends Device {
  constructor(
    driver: MR_DeviceDriver,
    surface: DecoratedDeviceSurface,
    firstChannelIndex: number,
    surfaceXPosition: number
  ) {
    const deviceSurface = deviceConfig.createExtenderSurface(surface, surfaceXPosition);
    super(driver, firstChannelIndex, deviceSurface, true);
  }
}

export function createDevices(driver: MR_DeviceDriver, surface: DecoratedDeviceSurface) {
  const deviceClasses = config.devices.map((deviceType) =>
    deviceType === "main" ? MainDevice : ExtenderDevice
  );

  let nextDeviceXPosition = 0;

  const devices = deviceClasses.map((deviceClass, deviceIndex) => {
    const device = new deviceClass(driver, surface, deviceIndex * 8, nextDeviceXPosition);

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
          detectionUnit.detectPortPair(device.ports.input, device.ports.output)
        );
      }
    }
  }

  return devices;
}
