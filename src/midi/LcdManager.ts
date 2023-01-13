import { sendSysexMessage } from ".";
// @ts-expect-error No type defs available
import abbreviate from "abbreviate";

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

  constructor(private midiOutput: MR_DeviceMidiOutput) {}

  sendText(context: MR_ActiveDevice, startIndex: number, text: string) {
    const chars = LcdManager.stringToUtf8CharArray(text.slice(0, 112));
    sendSysexMessage(this.midiOutput, context, [0x12, startIndex, ...chars]);
  }

  setChannelText(context: MR_ActiveDevice, row: 0 | 1, channelIndex: number, text: string) {
    while (text.length < 7) {
      text += " ";
    }
    this.sendText(context, row * 56 + channelIndex * 7, text);
  }
}
