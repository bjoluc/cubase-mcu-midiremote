import { closest as determineClosestColor } from "color-diff";
import { Device } from "../../devices";
import { ContextStateVariable, createElements } from "../../util";

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

export type RgbColor = { r: number; g: number; b: number };

type DeviceColorDefinition = { R: number; G: number; B: number; code: ScribbleStripColor };

const scribbleStripColorsRGB: DeviceColorDefinition[] = [
  { code: ScribbleStripColor.black, R: 0, G: 0, B: 0 },
  { code: ScribbleStripColor.red, R: 0xcc, G: 0, B: 0 },
  { code: ScribbleStripColor.green, R: 0, G: 0xbb, B: 0x22 },
  { code: ScribbleStripColor.yellow, R: 0xff, G: 0xcc, B: 0 },
  { code: ScribbleStripColor.blue, R: 0x00, G: 0, B: 0xff },
  { code: ScribbleStripColor.fuchsia, R: 0xff, G: 0x33, B: 0xcc },
  { code: ScribbleStripColor.aqua, R: 0x33, G: 0xcc, B: 0xdd },
  { code: ScribbleStripColor.white, R: 0xcc, G: 0xcc, B: 0xcc },
];

export class ColorManager {
  private static rgbToScribbleStripColor({ r, g, b }: RgbColor) {
    return (
      determineClosestColor(
        { R: r * 0xff, G: g * 0xff, B: b * 0xff },
        scribbleStripColorsRGB
      ) as DeviceColorDefinition
    ).code;
  }

  private colors: Array<ContextStateVariable<number>>;

  constructor(private device: Device) {
    this.colors = createElements(8, () => new ContextStateVariable(ScribbleStripColor.black));
  }

  private sendColors(context: MR_ActiveDevice) {
    this.device.ports.output.sendSysex(context, [
      0x72,
      ...this.colors.map((color) => color.get(context)),
      0xf7,
    ]);
  }

  setChannelColor(context: MR_ActiveDevice, channelIndex: number, color: ScribbleStripColor) {
    const colorVariable = this.colors[channelIndex];
    if (colorVariable.get(context) !== color) {
      colorVariable.set(context, color);
      this.sendColors(context);
    }
  }

  setChannelColorRgb(context: MR_ActiveDevice, channelIndex: number, color: RgbColor) {
    this.setChannelColor(context, channelIndex, ColorManager.rgbToScribbleStripColor(color));
  }

  resetColors(context: MR_ActiveDevice) {
    for (const color of this.colors) {
      color.set(context, ScribbleStripColor.white);
    }
    this.sendColors(context);
  }
}
