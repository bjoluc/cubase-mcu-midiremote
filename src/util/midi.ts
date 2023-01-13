export function sendSysexMessage(
  midiOutput: MR_DeviceMidiOutput,
  device: MR_ActiveDevice,
  messageBody: any[]
) {
  midiOutput.sendMidi(device, [0xf0, 0x00, 0x00, 0x66, 0x14, ...messageBody, 0xf7]);
}

export function sendNoteOn(
  midiOutput: MR_DeviceMidiOutput,
  device: MR_ActiveDevice,
  channel: number,
  pitch: number,
  velocity: boolean
) {
  midiOutput.sendMidi(device, [0x90 + channel, pitch, velocity ? 0xff : 0x00]);
}

export function makeButtonValueChangeHandler(midiOutput: MR_DeviceMidiOutput, note: number) {
  return (device: MR_ActiveDevice, newValue: number, difference: number) => {
    if (difference !== 0) {
      sendNoteOn(midiOutput, device, 0, note, Boolean(newValue));
    }
  };
}
