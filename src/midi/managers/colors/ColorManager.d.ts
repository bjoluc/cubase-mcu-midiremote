export type RgbColor = { r: number; g: number; b: number };

export interface ColorManager {
  /**
   * Sends all colors to the device in a SysEx message. Unless on initialization, you don't need to
   * call this method because it is automatically done by `setChannelColorRgb()`.
   */
  sendColors(context: MR_ActiveDevice): void;

  setChannelColorRgb(context: MR_ActiveDevice, channelIndex: number, color: RgbColor): void;

  resetColors(context: MR_ActiveDevice): void;
}
