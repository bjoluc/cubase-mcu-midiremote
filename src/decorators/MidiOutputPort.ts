class MidiOutputDecorator {
  constructor(
    private port: MR_DeviceMidiOutput,
    private isExtender: boolean,
  ) {}

  sendSysex = (context: MR_ActiveDevice, messageBody: number[]) => {
    this.port.sendMidi(context, [
      0xf0,
      0x00,
      0x00,
      0x66,
      0x14 + +this.isExtender,
      ...messageBody,
      0xf7,
    ]);
  };

  sendNoteOn = (
    context: MR_ActiveDevice,
    pitch: number,
    velocity: number | boolean,
    channelNumber = 0,
  ) => {
    this.port.sendMidi(context, [0x90 + channelNumber, pitch, +Boolean(velocity) * 0x7f]);
  };
}

export class MidiOutputPort extends MidiOutputDecorator {
  constructor(driver: MR_DeviceDriver, name: string, isExtender: boolean) {
    const port = driver.mPorts.makeMidiOutput(name);

    super(port, isExtender);

    return Object.assign(port, this);
  }
}

// TS merges this declaration with the `MidiOutputPort` class above
export interface MidiOutputPort extends MR_DeviceMidiOutput {}
