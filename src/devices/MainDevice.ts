import { ControlSectionSurfaceElements } from "../device-configs";
import { Device } from "./Device";
import { deviceConfig } from "/config";
import { GlobalState } from "/state";
import { TimerUtils } from "/util";

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
