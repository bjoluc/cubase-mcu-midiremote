import { ColorManager, RgbColor } from "./ColorManager";
import { Device } from "/devices";
import { ContextVariable, createElements } from "/util";

export class IconColorManager implements ColorManager {
  private colors: Array<ContextVariable<RgbColor>>;

  constructor(private device: Device) {
    this.colors = createElements(8, () => new ContextVariable({ r: 0, g: 0, b: 0 }));
  }

  sendColors(context: MR_ActiveDevice) {
    this.device.ports.output.sendMidi(context, [
      0xf0,
      0x00,
      0x02,
      0x4e,
      0x16,
      0x14,
      ...this.colors.flatMap((color) => {
        const { r, g, b } = color.get(context);
        return [Math.round(r * 127), Math.round(g * 127), Math.round(b * 127)];
      }),
      0xf7,
    ]);
  }

  setChannelColorRgb(context: MR_ActiveDevice, channelIndex: number, color: RgbColor) {
    const colorVariable = this.colors[channelIndex];
    const previousColor = colorVariable.get(context);

    if (previousColor.r !== color.r || previousColor.g !== color.g || previousColor.b !== color.b) {
      colorVariable.set(context, color);
      this.sendColors(context);
    }
  }

  resetColors(context: MR_ActiveDevice) {
    for (const color of this.colors) {
      color.set(context, { r: 0, g: 0, b: 0 });
    }
    this.sendColors(context);
  }
}
