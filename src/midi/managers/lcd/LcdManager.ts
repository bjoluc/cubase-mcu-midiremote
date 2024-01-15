import { Device } from "../../../devices";
import { GlobalBooleanVariables } from "../../../midi";
import { TimerUtils, createElements } from "../../../util";
import { ChannelTextManager } from "./ChannelTextManager";

export class LcdManager {
  static readonly channelWidth = DEVICE_NAME === "X-Touch" ? 7 : 6;

  private static asciiStringToCharArray(input: string) {
    const chars = [];
    for (let i = 0; i < input.length; i++) {
      chars.push(input.charCodeAt(i));
    }
    return chars;
  }

  static makeSpaces(length: number) {
    return Array(length + 1).join(" ");
  }

  private channels: ChannelTextManager[];

  constructor(
    private device: Device,
    globalBooleanVariables: GlobalBooleanVariables,
    timerUtils: TimerUtils,
  ) {
    this.channels = createElements(
      8,
      (channelIndex) =>
        new ChannelTextManager(
          globalBooleanVariables,
          timerUtils,
          this.sendChannelText.bind(this, channelIndex),
        ),
    );
  }

  private sendText(context: MR_ActiveDevice, startIndex: number, text: string) {
    const chars = LcdManager.asciiStringToCharArray(text.slice(0, 112));
    this.device.ports.output.sendSysex(context, [0x12, startIndex, ...chars]);
  }

  private sendChannelText(
    channelIndex: number,
    context: MR_ActiveDevice,
    row: number,
    text: string,
  ) {
    while (text.length < 7) {
      text += " ";
    }
    this.sendText(context, row * 56 + (channelIndex % 8) * 7, text);
  }

  getChannelTextManager(channelIndex: number) {
    return this.channels[channelIndex];
  }

  clearDisplays(context: MR_ActiveDevice) {
    this.sendText(context, 0, LcdManager.makeSpaces(112));
  }
}
