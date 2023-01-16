import { ColorManager } from "./ColorManager";
import { LcdManager } from "./LcdManager";
import { SegmentDisplayManager } from "./SegmentDisplayManager";

export function createMidiManagers(midiOutput: MR_DeviceMidiOutput) {
  return {
    color: new ColorManager(midiOutput),
    lcd: new LcdManager(midiOutput),
    segmentDisplay: new SegmentDisplayManager(midiOutput),
  };
}

export type MidiManagers = ReturnType<typeof createMidiManagers>;
