import { MidiOutputPort } from "/decorators/MidiOutputPort";

export class MidiPortPair {
  private static nextPortPairIndex = 1;

  private portPairIndex = MidiPortPair.nextPortPairIndex++;

  input: MR_DeviceMidiInput;
  output: MidiOutputPort;

  constructor(driver: MR_DeviceDriver, isExtender: boolean) {
    const name = isExtender ? "Extender" : "Main";

    this.input = driver.mPorts.makeMidiInput(`Input ${this.portPairIndex} - ${name}`);
    this.output = new MidiOutputPort(driver, `Output ${this.portPairIndex} - ${name}`, isExtender);
  }
}
