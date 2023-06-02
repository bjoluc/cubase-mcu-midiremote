import { config, deviceConfig } from "./config";
import { DecoratedDeviceSurface } from "./decorators/surface";
import { ChannelSurfaceElements, ControlSectionSurfaceElements, DeviceSurface } from "./devices";
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
  colorManager: ColorManager;
  lcdManager: LcdManager;

  constructor(
    driver: MR_DeviceDriver,
    public firstChannelIndex: number,
    deviceSurface: DeviceSurface,
    isExtender: boolean
  ) {
    this.surfaceWidth = deviceSurface.width;
    this.channelElements = deviceSurface.channelElements;

    this.ports = makePortPair(driver, isExtender);
    this.colorManager = new ColorManager(this);
    this.lcdManager = new LcdManager(this);
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

export class Devices {
  private devices: Device[] = [];

  constructor(driver: MR_DeviceDriver, surface: DecoratedDeviceSurface) {
    const deviceClasses = config.devices.map((deviceType) =>
      deviceType === "main" ? MainDevice : ExtenderDevice
    );

    let nextDeviceXPosition = 0;

    this.devices.push(
      ...deviceClasses.map((deviceClass, deviceIndex) => {
        const device = new deviceClass(driver, surface, deviceIndex * 8, nextDeviceXPosition);

        nextDeviceXPosition += device.surfaceWidth;

        return device;
      })
    );

    if (this.devices.length === 1) {
      driver
        .makeDetectionUnit()
        .detectPortPair(this.devices[0].ports.input, this.devices[0].ports.output)
        .expectInputNameEquals("X-Touch")
        .expectOutputNameEquals("X-Touch");
    }
  }

  getDeviceByChannelIndex(channelIndex: number) {
    return this.devices[Math.floor(channelIndex / 8)];
  }

  forEach = this.devices.forEach.bind(this.devices);
  map = this.devices.map.bind(this.devices);
  flatMap = this.devices.flatMap.bind(this.devices);
  filter = this.devices.filter.bind(this.devices);
}
