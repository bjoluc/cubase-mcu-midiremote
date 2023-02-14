import { ContextStateVariable, createElements } from "../../util";
import { MidiPorts } from "../MidiPorts";

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

export class ColorManager {
  private static rgbToScribbleStripColor({ r, g, b }: RgbColor): ScribbleStripColor {
    const colors: Array<RgbColor & { code: number }> = [
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

  private colors: Array<ContextStateVariable<number>>;

  constructor(private ports: MidiPorts) {
    this.colors = createElements(
      ports.getChannelCount(),
      () => new ContextStateVariable(ScribbleStripColor.black)
    );
  }

  private sendColors(context: MR_ActiveDevice) {
    this.ports.forEachPortPair(({ output, firstChannelIndex }) => {
      output.sendSysex(context, [
        0x72,
        ...this.colors
          .slice(firstChannelIndex, firstChannelIndex + 8)
          .map((color) => color.get(context)),
        0xf7,
      ]);
    });
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
