import { ChannelTextManager } from "./ChannelTextManager";
import { deviceConfig } from "/config";
import { Device } from "/devices";
import { GlobalState } from "/state";
import { TimerUtils, createElements } from "/util";

export class LcdManager {
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

  channelTextManagers: ChannelTextManager[];

  constructor(
    private device: Device,
    globalState: GlobalState,
    timerUtils: TimerUtils,
  ) {
    this.channelTextManagers = createElements(
      8,
      (channelIndex) =>
        new ChannelTextManager(
          globalState,
          timerUtils,
          this.sendChannelText.bind(this, channelIndex),
        ),
    );
  }

  private sendText(
    context: MR_ActiveDevice,
    startIndex: number,
    text: string,
    targetSecondaryDisplay = false,
  ) {
    const chars = LcdManager.asciiStringToCharArray(text.slice(0, 112));

    if (targetSecondaryDisplay) {
      this.device.ports.output.sendMidi(context, [
        0xf0,
        0x00,
        0x02,
        0x4e,
        0x15,
        0x13,
        startIndex,
        ...chars,
        0xf7,
      ]);
    } else {
      this.device.ports.output.sendSysex(context, [0x12, startIndex, ...chars]);
    }
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

    let isSecondaryDisplayRow = false;
    if (row > 1) {
      isSecondaryDisplayRow = true;
      row -= 2;
    }

    this.sendText(context, row * 56 + (channelIndex % 8) * 7, text, isSecondaryDisplayRow);
  }

  clearDisplays(context: MR_ActiveDevice) {
    const spaces = LcdManager.makeSpaces(112);
    this.sendText(context, 0, spaces);

    if (deviceConfig.secondaryScribbleStripSetup) {
      this.sendText(context, 0, spaces, true);
    }
  }
}
