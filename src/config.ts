import { Except, Simplify } from "type-fest";
import { DeviceConfig } from "/device-configs";

// @ts-expect-error This path is resolved by a custom esbuild plugin
import { deviceConfig as sourceDeviceConfig } from "current-device";

export const deviceConfig = sourceDeviceConfig as DeviceConfig;

export type ScriptConfiguration = Simplify<
  Except<typeof CONFIGURATION, "devices" | "displayColorMode"> & {
    devices: Array<"main" | "extender">;
    displayColorMode: "encoders" | "channels" | "none";
  }
>;

export const config: ScriptConfiguration = {
  // Set defaults for config options that do not apply to all devices
  devices: ["main"],
  displayColorMode: "encoders",

  // @ts-expect-error `CONFIGURATION` is not yet assigned in this source file
  ...(CONFIGURATION as any),
};

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
   * multiple main and multiple extender devices. The order of the list below should match the order
   * of the devices on your desk from left to right. The port setup in the "Add MIDI Controller
   * Surface" dialog reflects this order for input and output ports, i.e., the first input and the
   * first output port belong to the leftmost device while the last input and the last output port
   * belong to the rightmost device.
   *
   * @devices !X-Touch One, !UF1
   */
  devices: ["main"],

  /**
   * Whether touching a channel's fader will select the channel ("Auto Select"). Replace `true` with
   * `false` below to disable auto selection.
   */
  enableAutoSelect: true,

  /**
   * By default, the main fader is mapped to the first output channel's volume. If you use the
   * Control Room, you can map the main fader to the control room level instead by replacing `false`
   * with `true` below.
   */
  mapMainFaderToControlRoom: false,

  /**
   * In old Cubase versions, pushing an encoder in the PAN encoder assignment used to reset the
   * panner to "center" instead of toggling "Monitor Active". By default, this script restores this
   * behavior, i.e. pressing push encoders resets channel panners.
   *
   * Set this config option to `false` to make encoder pushes in PAN mode toggle a channel's monitor
   * mode. In that case, you can still shift-press encoders to reset panners.
   */
  resetPanOnEncoderPush: true,

  /**
   * The flags below control which channel types will be visible (i.e. mapped) on your device(s).
   * For each channel type,
   *
   *  * `true` means the corresponding channel type will be visible on your device(s).
   *  * `false` means the corresponding channel type will be hidden on your device(s).
   *
   * By default, all channels except input and output channels are visible, like in the
   * Cubase-builtin Mackie Control mapping. Feel free to change the flags below to your liking.
   */
  channelVisibility: {
    audio: true,
    instrument: true,
    sampler: true,
    midi: true,
    fx: true,
    group: true,
    vca: true,
    input: false,
    output: false,
  },

  /**
   * The way scribble strip display colors are determined. Set this to
   *
   *  * `"encoders"` to make scribble strip displays pick up colors from encoders, i.e., each
   *    display uses the track color of the channel its encoder value belongs to. When an encoder is
   *    unassigned, its scribble strip falls back to the corresponding mixer channel's color.
   *
   *  * `"channels"` to makes scribble strips ignore encoder colors and always use their channels'
   *    track colors instead. When a channel is unassigned but its encoder is assigned, the display
   *    will be lit white anyway.
   *
   *  * `"none"` to disable display color management. In that case, scribble strip displays will
   *    always be white unless a display's channel and encoder is unassigned, in which case the
   *    display will revert to black.
   *
   * @devices X-Touch, X-Touch One, V1-M, P1-M
   */
  displayColorMode: "encoders",

  /**
   * If you are frequently using display metering on your MCU, you can set this option to `true` to
   * make the SMPTE/Beats button toggle metering modes by default and switch between time formats
   * only when the Shift button is held.
   *
   * @devices MCU Pro
   */
  toggleMeteringModeWithoutShift: false,

  /**
   * You can flip the scribble strip rows back and forth via "Shift + Display Name/Value". If you
   * would like to change the default order (the one the script is initialized with), set this
   * option to `true`.
   */
  flipDisplayRowsByDefault: false,

  /**
   * Set this option to `true` if you want the jog wheel to move the cursor in zoom mode too
   * (instead of zooming in and out).
   */
  disableJogWheelZoom: false,

  /**
   * If you set this option to `true`, the channel left/right buttons will be mapped to navigate
   * encoder parameter pages by default, and only move the mixer channels while Shift is held – just
   * like Cubase's default Mackie Control integration does.
   */
  mapChannelButtonsToParameterPageNavigation: false,
};
