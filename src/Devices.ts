import { config } from "./config";
import { DecoratedDeviceSurface } from "./decorators/surface";
import { ColorManager } from "./midi/managers/ColorManager";
import { LcdManager } from "./midi/managers/LcdManager";

import { makePortPair, PortPair } from "./midi/PortPair";
import {
  channelElementsWidth,
  ChannelSurfaceElements,
  controlSectionElementsWidth,
  ControlSectionSurfaceElements,
  createChannelSurfaceElements,
  createControlSectionSurfaceElements,
  surfaceHeight,
} from "./surface";

interface DeviceProperties {
  driver: MR_DeviceDriver;
  surface: DecoratedDeviceSurface;
  firstChannelIndex: number;
  surfaceXPosition: number;
}

/**
 * A `Device` represents a physical device and manages its MIDI ports and surface elements
 */
export abstract class Device {
  ports: PortPair;
  colorManager: ColorManager;
  lcdManager: LcdManager;

  readonly firstChannelIndex: number;
  channelElements: ChannelSurfaceElements;

  constructor(
    { driver, firstChannelIndex, surface, surfaceXPosition }: DeviceProperties,
    isExtender: boolean,
    panelWidth: number
  ) {
    this.firstChannelIndex = firstChannelIndex;

    this.ports = makePortPair(driver, isExtender);
    this.colorManager = new ColorManager(this);
    this.lcdManager = new LcdManager(this);

    // Draw device frame
    surface.makeBlindPanel(surfaceXPosition, 0, panelWidth, surfaceHeight);

    this.channelElements = createChannelSurfaceElements(surface, surfaceXPosition);
  }
}

export class MainDevice extends Device {
  static readonly surfaceWidth = channelElementsWidth + controlSectionElementsWidth;

  controlSectionElements: ControlSectionSurfaceElements;

  constructor(properties: DeviceProperties) {
    super(properties, false, MainDevice.surfaceWidth);

    this.controlSectionElements = createControlSectionSurfaceElements(
      properties.surface,
      properties.surfaceXPosition + channelElementsWidth
    );
  }
}

export class ExtenderDevice extends Device {
  static readonly surfaceWidth = channelElementsWidth + 1;

  constructor(properties: DeviceProperties) {
    super(properties, true, ExtenderDevice.surfaceWidth);
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
        const device = new deviceClass({
          firstChannelIndex: deviceIndex * 8,
          driver,
          surface,
          surfaceXPosition: nextDeviceXPosition,
        });

        nextDeviceXPosition += deviceClass.surfaceWidth;

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
