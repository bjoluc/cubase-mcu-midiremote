import { EnhancedMidiOutput } from "./PortPair";

export function sendChannelMeterMode(
  context: MR_ActiveDevice,
  outputPort: EnhancedMidiOutput,
  enableLcdLevelMeter: boolean
) {
  for (let channelId = 0; channelId < 8; channelId++) {
    outputPort.sendSysex(context, [0x20, channelId, 4 * +enableLcdLevelMeter + 1]);
  }
}

export function setGlobalMeterModeOrientation(
  context: MR_ActiveDevice,
  outputPort: EnhancedMidiOutput,
  isVertical: boolean
) {
  outputPort.sendSysex(context, [0x21, +isVertical]);
}
