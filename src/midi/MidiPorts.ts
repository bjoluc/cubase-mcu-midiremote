export interface PortPair {
  input: MR_DeviceMidiInput;
  output: EnhancedMidiOutput;
}

export interface EnhancedMidiOutput extends MR_DeviceMidiOutput {
  sendSysex: (context: MR_ActiveDevice, messageBody: number[]) => void;
  sendNoteOn: (context: MR_ActiveDevice, pitch: number, velocity: number | boolean) => void;
}

export class MidiPorts {
  private static makePortPair(driver: MR_DeviceDriver, name: string, isExtender: boolean) {
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

  private mainPorts: PortPair;

  private extenderPorts?: PortPair;

  constructor(
    driver: MR_DeviceDriver,
    private useExtender: boolean,
    private isExtenderLeft: boolean
  ) {
    const ports = driver.mPorts;
    this.mainPorts = MidiPorts.makePortPair(driver, "Main", false);

    if (this.useExtender) {
      this.extenderPorts = MidiPorts.makePortPair(driver, "Extender", true);
    } else {
      driver
        .makeDetectionUnit()
        .detectPortPair(this.mainPorts.input, this.mainPorts.output)
        .expectInputNameEquals("X-Touch")
        .expectOutputNameEquals("X-Touch");
    }
  }

  getChannelCount() {
    return this.useExtender ? 16 : 8;
  }

  getMainPorts() {
    return this.mainPorts;
  }

  getPortsByChannelIndex(channel: number) {
    if (
      !this.useExtender ||
      (this.isExtenderLeft && channel > 7) ||
      (!this.isExtenderLeft && channel <= 7)
    ) {
      return this.mainPorts;
    }
    return this.extenderPorts!;
  }

  forEachPortPair(callback: (portPair: PortPair, firstChannelIndex: number) => void) {
    for (let i = 0; i < this.getChannelCount() / 8; i++) {
      const firstChannelIndex = i * 8;
      callback(this.getPortsByChannelIndex(firstChannelIndex), firstChannelIndex);
    }
  }
}
