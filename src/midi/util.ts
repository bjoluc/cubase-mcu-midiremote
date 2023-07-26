import { EnhancedMidiOutput } from "./PortPair";

export function sendChannelMeterMode(
  context: MR_ActiveDevice,
  outputPort: EnhancedMidiOutput,
  channelId: number,
  enableLcdLevelMeter: boolean
) {
  outputPort.sendSysex(context, [0x20, channelId, 2 * +enableLcdLevelMeter + 1]);
}

export function sendGlobalMeterModeOrientation(
  context: MR_ActiveDevice,
  outputPort: EnhancedMidiOutput,
  isVertical: boolean
) {
  outputPort.sendSysex(context, [0x21, +isVertical]);
}

/**
 * Sends a `meterLevel` for device channel `channelIndex` via the provided `outputPort`. The
 * following meter levels are supported by the MCU protocol according to the Logic Control user
 * manual:
 *
 * Value | Function
 * --- | ---
 * 0x0 - 0xC | level meter 0%..100% (Overload not cleared!)
 * 0xE | set overload
 * 0xF | clear overload
 */
export function sendMeterLevel(
  context: MR_ActiveDevice,
  outputPort: EnhancedMidiOutput,
  channelIndex: number,
  meterLevel: number
) {
  outputPort.sendMidi(context, [0xd0, (channelIndex << 4) + meterLevel]);
}
