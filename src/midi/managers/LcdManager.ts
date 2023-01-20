// @ts-expect-error No type defs available
import abbreviate from "abbreviate";
import { EnhancedMidiOutput, MidiPorts } from "../MidiPorts";

export class LcdManager {
  /**
   * Given a string, returns an abbreviated version of it consisting of at most 7 characters
   */
  static abbreviateString(input: string) {
    if (input.length < 7) {
      return input;
    }

    return abbreviate(input, { length: 7 });
  }

  static stringToUtf8CharArray(input: string) {
    const chars = [];
    for (let i = 0; i < input.length; i++) {
      chars.push(input.charCodeAt(i));
    }
    return chars;
  }

  constructor(private ports: MidiPorts) {}

  private sendText(
    output: EnhancedMidiOutput,
    context: MR_ActiveDevice,
    startIndex: number,
    text: string
  ) {
    const chars = LcdManager.stringToUtf8CharArray(text.slice(0, 112));
    output.sendSysex(context, [0x12, startIndex, ...chars]);
  }

  setChannelText(context: MR_ActiveDevice, row: number, channelIndex: number, text: string) {
    while (text.length < 7) {
      text += " ";
    }
    this.sendText(
      this.ports.getPortsByChannelIndex(channelIndex).output,
      context,
      row * 56 + (channelIndex % 8) * 7,
      text
    );
  }

  clearDisplays(context: MR_ActiveDevice) {
    for (let i = 0; i < this.ports.getChannelCount() / 8; i++) {
      this.sendText(
        this.ports.getPortsByChannelIndex(i * 8).output,
        context,
        0,
        Array(113).join(" ")
      );
    }
  }
}
