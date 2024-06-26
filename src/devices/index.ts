import { ExtenderDevice } from "./ExtenderDevice";
import { MainDevice } from "./MainDevice";
import { config, deviceConfig } from "/config";
import { GlobalState } from "/state";
import { TimerUtils } from "/util";

export { Device } from "./Device";
export { ExtenderDevice } from "./ExtenderDevice";
export { MainDevice } from "./MainDevice";

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

  if (devices.filter((device) => device instanceof MainDevice).length === 1) {
    for (const detectionUnitConfig of deviceConfig.detectionUnits) {
      const detectionUnit = driver.makeDetectionUnit();

      let nextExtenderId = 1;
      for (const device of devices) {
        const portPair = detectionUnit.detectPortPair(device.ports.input, device.ports.output);

        if (device instanceof MainDevice) {
          detectionUnitConfig["main"](portPair);
        } else {
          detectionUnitConfig["extender"](portPair, nextExtenderId++);
        }
      }
    }
  }

  return devices;
}
