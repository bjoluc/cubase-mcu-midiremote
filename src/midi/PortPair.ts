export interface PortPair {
  input: MR_DeviceMidiInput;
  output: EnhancedMidiOutput;
}

export interface EnhancedMidiOutput extends MR_DeviceMidiOutput {
  sendSysex: (context: MR_ActiveDevice, messageBody: number[]) => void;
  sendNoteOn: (context: MR_ActiveDevice, pitch: number, velocity: number | boolean) => void;
}

export function makePortPair(driver: MR_DeviceDriver, isExtender: boolean): PortPair {
  const name = isExtender ? "Extender" : "Main";
  const input = driver.mPorts.makeMidiInput(`${name} Input`);
  const output = driver.mPorts.makeMidiOutput(`${name} Output`) as EnhancedMidiOutput;

  output.sendSysex = (context, messageBody) => {
    output.sendMidi(context, [0xf0, 0x00, 0x00, 0x66, 0x14 + +isExtender, ...messageBody, 0xf7]);
  };

  output.sendNoteOn = (context: MR_ActiveDevice, pitch: number, velocity: number | boolean) => {
    output.sendMidi(context, [0x90, pitch, +Boolean(velocity) * 0xff]);
  };

  return { input, output };
}
