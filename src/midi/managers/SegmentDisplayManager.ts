import { createElements } from "src/util";

export class SegmentDisplayManager {
  private segmentValues = createElements(12, () => 0x00);

  private updateSegment(
    context: MR_ActiveDevice,
    segmentId: number,
    digit: number | null,
    hasDot = false
  ) {
    let value = 0x30 + (digit ?? -0x10);
    if (hasDot) {
      value += 0x40;
    }

    if (value !== this.segmentValues[segmentId]) {
      this.segmentValues[segmentId] = value;
      this.midiOutput.sendMidi(context, [0xb0, 0x40 + segmentId, value]);
    }
  }

  private updateSegmentsByNumberString(
    context: MR_ActiveDevice,
    lastSegmentId: number,
    segmentCount: number,
    numberString: string
  ) {
    for (let i = 0; i < segmentCount; i++) {
      this.updateSegment(
        context,
        lastSegmentId + i,
        numberString.length < i + 1
          ? null
          : parseInt(numberString[numberString.length - i - 1], 10),
        i === 0 && lastSegmentId !== 0
      );
    }
  }

  constructor(private midiOutput: MR_DeviceMidiOutput) {}

  /**
   * Update the 7-segment display to show the provided `time` string – a string consisting of four
   * (single- or multi-digit) numbers, separated by `.` or `:`.
   */
  setTimeString(context: MR_ActiveDevice, time: string) {
    const groups = time.split(/[\.\:]/);
    this.updateSegmentsByNumberString(context, 0, 3, groups[3]);
    this.updateSegmentsByNumberString(context, 3, 2, groups[2]);
    this.updateSegmentsByNumberString(context, 5, 2, groups[1]);
    this.updateSegmentsByNumberString(context, 7, 3, groups[0]);
  }

  clearAllSegments(context: MR_ActiveDevice) {
    for (let i = 0; i < this.segmentValues.length; i++) {
      this.updateSegment(context, i, null);
    }
  }
}
