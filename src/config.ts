import { Except, Simplify } from "type-fest";
import { DeviceConfig } from "./device-configs";

// @ts-expect-error This path is resolved by a custom esbuild plugin
import { deviceConfig as sourceDeviceConfig } from "current-device";

export const deviceConfig = sourceDeviceConfig as DeviceConfig;

export type DevicesConfiguration = Array<"main" | "extender">;

export type ScriptConfiguration = Simplify<
  Except<typeof CONFIGURATION, "devices"> & {
    devices: DevicesConfiguration;
  }
>;

// @ts-expect-error
export const config = CONFIGURATION as ScriptConfiguration;

// Everything below "BEGIN JS" is copied directly to the top of the build file (with some values
// being replaced).

// BEGIN JS
/**
 * Script configuration – edit the following options to match your preferences
 */
var CONFIGURATION = {
  /**
   * If you have an extender unit, change this option to either `["extender", "main"]` (if your
   * extender is placed on the left side of the main unit) or `["main", "extender"]` (if the
   * extender is on the right side).
   *
   * You can also specify an arbitrary combination of "main" and "extender" devices here, including
   * multiple X-Touch ("main") and multiple X-Touch Extender ("extender") devices. The order of the
   * list below should match the order of the devices on your desk from left to right. The port
   * setup in the "Add MIDI Controller Surface" dialog reflects this order for input and output
   * ports, i.e., the first input and the first output port belong to the leftmost device while the
   * last input and the last output port belong to the rightmost device.
   */
  devices: ["main"],

  /**
   * Whether touching a channel's fader will select the channel ("Auto Select"). Replace `true` with
   * `false` below to disable auto selection.
   */
  enableAutoSelect: true,

  /**
   * If you don't use the Control Room or your version of Cubase doesn't have it, you'll likely want
   * the main fader to control the first output channel like in the default Mackie Control mapping.
   * You can achieve this by replacing `true` with `false` below.
   */
  mapMainFaderToControlRoom: true,

  /**
   * By default, scribble strip displays pick up colors from encoders, i.e., each display uses the
   * track color of the channel its encoder value belongs to. When an encoder is unassigned, the
   * scribble strip below it falls back to the corresponding mixer channel's color.
   *
   * Setting this option to `false` makes scribble strips ignore encoder colors and always use their
   * channels' track colors instead.
   *
   * @device X-Touch
   */
  useEncoderColors: true,

  /**
   * If you are frequently using display metering on your MCU, you can set this option to `true` to
   * make the SMPTE/Beats button toggle metering modes by default and switch between time formats
   * only when the Shift button is held.
   *
   * @device MCU Pro
   */
  toggleMeteringModeWithoutShift: false,
};
