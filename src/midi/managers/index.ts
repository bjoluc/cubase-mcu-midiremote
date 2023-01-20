import { MidiPorts } from "../MidiPorts";
import { ColorManager } from "./ColorManager";
import { LcdManager } from "./LcdManager";
import { SegmentDisplayManager } from "./SegmentDisplayManager";

export function createMidiManagers(ports: MidiPorts) {
  return {
    color: new ColorManager(ports),
    lcd: new LcdManager(ports),
    segmentDisplay: new SegmentDisplayManager(ports.getMainPorts().output),
  };
}

export type MidiManagers = ReturnType<typeof createMidiManagers>;
