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
    const device = new (deviceType === "main"
      ? MainDevice
      : deviceConfig.createExtenderSurface
        ? ExtenderDevice
        : MainDevice)(
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
