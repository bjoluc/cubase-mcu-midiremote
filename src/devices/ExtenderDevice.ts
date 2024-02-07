import { Device } from "./Device";
import { deviceConfig } from "/config";
import { GlobalState } from "/state";
import { TimerUtils } from "/util";

export class ExtenderDevice extends Device {
  constructor(
    driver: MR_DeviceDriver,
    surface: MR_DeviceSurface,
    globalState: GlobalState,
    timerUtils: TimerUtils,
    firstChannelIndex: number,
    surfaceXPosition: number,
  ) {
    const deviceSurface = deviceConfig.createExtenderSurface!(surface, surfaceXPosition);
    super(driver, firstChannelIndex, deviceSurface, globalState, timerUtils, true);
  }
}
