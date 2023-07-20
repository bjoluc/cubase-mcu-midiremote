import { Device } from "../devices";
import { makeCallbackCollection } from "../util";
import { SegmentDisplayManager } from "./managers/SegmentDisplayManager";
import { sendChannelMeterModes, sendGlobalMeterModeOrientation } from "./util";

export type ActivationCallbacks = ReturnType<typeof setupDeviceConnection>["activationCallbacks"];

export function setupDeviceConnection(driver: MR_DeviceDriver, devices: Device[]) {
  const activationCallbacks = makeCallbackCollection(driver, "mOnActivate");
  const segmentDisplayManager = new SegmentDisplayManager(devices);

  activationCallbacks.addCallback((context) => {
    // Initially disable LCD channel metering for all devices
    for (const device of devices) {
      sendGlobalMeterModeOrientation(context, device.ports.output, true);
      sendChannelMeterModes(context, device.ports.output, false);
    }
  });

  driver.mOnDeactivate = (context) => {
    segmentDisplayManager.clearAssignment(context);
    segmentDisplayManager.clearTime(context);

    devices.forEach((device) => {
      device.colorManager?.resetColors(context);
      device.lcdManager.clearDisplays(context);

      const output = device.ports.output;
      // Reset via `output.sendSysex(context, [0x63])` is not recognized by the X-Touch :(

      // Reset faders
      for (let faderIndex = 0; faderIndex < 9; faderIndex++) {
        output.sendMidi(context, [0xe0 + faderIndex, 0, 0]);
      }

      // Reset LEDs
      for (let note = 0; note < 0x76; note++) {
        output.sendNoteOn(context, note, 0);
      }

      // Reset encoder LED rings
      for (let encoderIndex = 0; encoderIndex < 8; encoderIndex++) {
        output.sendMidi(context, [0xb0, 0x30 + encoderIndex, 0]);
      }
    });
  };

  return { activationCallbacks, segmentDisplayManager };
}
