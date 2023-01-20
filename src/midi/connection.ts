import { MidiManagers } from "./managers";
import { MidiPorts } from "./MidiPorts";

export function setupDeviceConnectionHandling(
  driver: MR_DeviceDriver,
  ports: MidiPorts,
  managers: MidiManagers
) {
  driver.mOnDeactivate = (context) => {
    managers.color.resetColors(context);
    managers.lcd.clearDisplays(context);
  };
}
