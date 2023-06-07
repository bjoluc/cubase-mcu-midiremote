// @ts-expect-error No type defs available
import abbreviate from "abbreviate";
import { Device } from "../../Devices";

export class LcdManager {
  static readonly channelWidth = DEVICE_NAME === "X-Touch" ? 7 : 6;

  /**
   * Strips any non-ASCII character from the provided string, since devices only support ASCII.
   **/
  static stripNonAsciiCharacters(input: string) {
    return input.replace(/[^\x00-\x7F]/g, "");
  }

  /**
   * Given a <= `LcdManager.channelWidth` characters long string, returns a left-padded version of
   * it that appears centered on a `LcdManager.channelWidth`-character display.
   */
  static centerString(input: string) {
    if (input.length >= LcdManager.channelWidth) {
      return input;
    }

    return LcdManager.makeSpaces(Math.floor((LcdManager.channelWidth - input.length) / 2)) + input;
  }

  /**
   * Given a string, returns an abbreviated version of it consisting of at most
   * `LcdManager.channelWidth` characters.
   */
  static abbreviateString(input: string) {
    if (input.length < LcdManager.channelWidth) {
      return input;
    }

    return abbreviate(input, { length: LcdManager.channelWidth });
  }

  private static asciiStringToCharArray(input: string) {
    const chars = [];
    for (let i = 0; i < input.length; i++) {
      chars.push(input.charCodeAt(i));
    }
    return chars;
  }

  private static makeSpaces(length: number) {
    return Array(length + 1).join(" ");
  }

  constructor(private device: Device) {}

  private sendText(context: MR_ActiveDevice, startIndex: number, text: string) {
    const chars = LcdManager.asciiStringToCharArray(text.slice(0, 112));
    this.device.ports.output.sendSysex(context, [0x12, startIndex, ...chars]);
  }

  setChannelText(context: MR_ActiveDevice, row: number, channelIndex: number, text: string) {
    while (text.length < LcdManager.channelWidth) {
      text += " ";
    }
    this.sendText(context, row * 56 + (channelIndex % 8) * 7, text);
  }

  clearDisplays(context: MR_ActiveDevice) {
    this.sendText(context, 0, LcdManager.makeSpaces(112));
  }
}
