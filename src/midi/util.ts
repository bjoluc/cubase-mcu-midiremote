import { EnhancedMidiOutput } from "./PortPair";

export function sendChannelMeterModes(
  context: MR_ActiveDevice,
  outputPort: EnhancedMidiOutput,
  enableLcdLevelMeter: boolean
) {
  for (let channelId = 0; channelId < 8; channelId++) {
    outputPort.sendSysex(context, [0x20, channelId, 4 * +enableLcdLevelMeter + 1]);
  }
}

export function sendGlobalMeterModeOrientation(
  context: MR_ActiveDevice,
  outputPort: EnhancedMidiOutput,
  isVertical: boolean
) {
  outputPort.sendSysex(context, [0x21, +isVertical]);
}
