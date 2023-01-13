import { sendSysexMessage } from "./util/midi";
import { createElements } from "./util";

export enum ScribbleStripColor {
  black = 0x00,
  red = 0x01,
  green = 0x02,
  yellow = 0x03,
  blue = 0x04,
  fuchsia = 0x05,
  aqua = 0x06,
  white = 0x07,
}

export class ColorManager {
  static rgbToScribbleStripColor(r: number, g: number, b: number): ScribbleStripColor {
    const colors = [
      { code: ScribbleStripColor.black, r: 0, g: 0, b: 0 },
      { code: ScribbleStripColor.red, r: 1, g: 0, b: 0 },
      { code: ScribbleStripColor.green, r: 0, g: 1, b: 0 },
      { code: ScribbleStripColor.yellow, r: 1, g: 1, b: 0 },
      { code: ScribbleStripColor.blue, r: 0, g: 0, b: 1 },
      { code: ScribbleStripColor.fuchsia, r: 1, g: 0, b: 1 },
      { code: ScribbleStripColor.aqua, r: 0, g: 1, b: 1 },
      { code: ScribbleStripColor.white, r: 1, g: 1, b: 1 },
    ];

    // Find nearest neighbor
    return (
      colors
        // Compute distance to target color
        .map((color) => ({
          code: color.code,
          distance: Math.abs(color.r - r) + Math.abs(color.g - g) + Math.abs(color.b - b),
        }))
        // Sort ascending by computed distance
        .sort((a, b) => (a.distance < b.distance ? -1 : a.distance > b.distance ? 1 : 0))[0].code
    );
  }

  private colors: number[] = createElements(8, () => 0x00);

  constructor(private midiOutput: MR_DeviceMidiOutput) {}

  setChannelColor(device: MR_ActiveDevice, channelIndex: number, color: ScribbleStripColor) {
    this.colors[channelIndex] = color;
    this.sendColors(device);
  }

  setChannelColorRgb(
    device: MR_ActiveDevice,
    channelIndex: number,
    r: number,
    g: number,
    b: number
  ) {
    this.setChannelColor(device, channelIndex, ColorManager.rgbToScribbleStripColor(r, g, b));
  }

  private sendColors(device: MR_ActiveDevice) {
    sendSysexMessage(this.midiOutput, device, [0x72, ...this.colors, 0xf7]);
  }
}
