import { sendSysexMessage } from ".";
import { MidiManagers } from "./managers";

export function setupDeviceConnectionHandling(
  driver: MR_DeviceDriver,
  midiInput: MR_DeviceMidiInput,
  midiOutput: MR_DeviceMidiOutput,
  managers: MidiManagers
) {
  driver.mOnDeactivate = (context) => {
    managers.color.resetColors(context);
    managers.lcd.clearDisplays(context);

    // sendSysexMessage(midiOutput, context, [0x0f, 0x7f]);
  };
}
