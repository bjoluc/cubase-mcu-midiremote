import { config } from "../config";

export interface PortPair {
  input: MR_DeviceMidiInput;
  output: EnhancedMidiOutput;
  firstChannelIndex: number;
}

export interface EnhancedMidiOutput extends MR_DeviceMidiOutput {
  sendSysex: (context: MR_ActiveDevice, messageBody: number[]) => void;
  sendNoteOn: (context: MR_ActiveDevice, pitch: number, velocity: number | boolean) => void;
}

export class MidiPorts {
  private static makePortPair(driver: MR_DeviceDriver, deviceIndex: number, isExtender: boolean) {
    const name = isExtender ? "Extender" : "Main";
    const input = driver.mPorts.makeMidiInput(`${name} Input`);
    const output = driver.mPorts.makeMidiOutput(`${name} Output`) as EnhancedMidiOutput;

    output.sendSysex = (context, messageBody) => {
      output.sendMidi(context, [0xf0, 0x00, 0x00, 0x66, 0x14 + +isExtender, ...messageBody, 0xf7]);
    };

    output.sendNoteOn = (context: MR_ActiveDevice, pitch: number, velocity: number | boolean) => {
      output.sendMidi(context, [0x90, pitch, +Boolean(velocity) * 0xff]);
    };

    return { input, output, firstChannelIndex: deviceIndex * 8 };
  }

  // @ts-expect-error We're assuming there is one "main" deviceType in the `devices` config
  private mainPorts: PortPair;

  private portPairs: PortPair[];

  constructor(driver: MR_DeviceDriver) {
    this.portPairs = config.devices.map((deviceType, deviceIndex) => {
      const isExtender = deviceType !== "main";
      const portPair = MidiPorts.makePortPair(driver, deviceIndex, isExtender);

      if (!isExtender) {
        this.mainPorts = portPair;
      }

      return portPair;
    });

    if (config.devices.length === 1) {
      driver
        .makeDetectionUnit()
        // @ts-expect-error We're assuming that a main device always exists
        .detectPortPair(this.mainPorts.input, this.mainPorts.output)
        .expectInputNameEquals("X-Touch")
        .expectOutputNameEquals("X-Touch");
    }
  }

  getChannelCount() {
    return this.portPairs.length * 8;
  }

  getMainPorts() {
    return this.mainPorts;
  }

  getPortsByChannelIndex(channelIndex: number) {
    return this.portPairs[Math.floor(channelIndex / 8)];
  }

  forEachPortPair(callback: (portPair: PortPair) => void) {
    this.portPairs.forEach(callback);
  }
}
