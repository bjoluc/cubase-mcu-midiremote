import { ContextStateVariable, createElements } from "../../util";

export class SegmentDisplayManager {
  private segmentValues = createElements(12, () => new ContextStateVariable(0x00));

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

    if (value !== this.segmentValues[segmentId].get(context)) {
      this.segmentValues[segmentId].set(context, value);
      this.midiOutput.sendMidi(context, [0xb0, 0x40 + segmentId, value]);
    }
  }

  private updateSegmentsByString(context: MR_ActiveDevice, lastSegmentId: number, string: string) {
    let currentSegmentId = lastSegmentId;
    let hasCurrentSegmentDot = false;
    for (const char of Array.from(string).reverse()) {
      if (char === "." || char === ":") {
        hasCurrentSegmentDot = true;
      } else {
        this.updateSegment(
          context,
          currentSegmentId,
          char === " " ? null : parseInt(char, 10),
          hasCurrentSegmentDot
        );
        currentSegmentId++;
        hasCurrentSegmentDot = false;
      }
    }
  }

  constructor(private midiOutput: MR_DeviceMidiOutput) {}

  /**
   * Update the 7-segment display to show the provided `time` string – a string consisting of
   * numbers, spaces, dots and colons.
   */
  setTimeString(context: MR_ActiveDevice, time: string) {
    // If `time` is separated three times by `.` or `:`, fill it with spaces to match the way digits
    // are grouped on the device
    const match = /^([\d ]+[\.\:])([\d ]+)([\.\:])([\d ]+)([\.\:])([\d ]+)$/.exec(time);
    if (match) {
      time =
        match[1] +
        match[2].padStart(2, " ") +
        match[3] +
        match[4].padStart(2, " ") +
        match[5] +
        match[6].padStart(3, " ");
    }

    this.updateSegmentsByString(
      context,
      0,
      time.padStart(10 + time.replaceAll(/[^\.\:]/g, "").length, " ")
    );
  }

  setAssignment(context: MR_ActiveDevice, assignment: string) {
    this.updateSegment(context, 10, parseInt(assignment[0]));
    this.updateSegment(context, 11, assignment.length > 1 ? parseInt(assignment[1]) : null);
  }

  clearAssignment(context: MR_ActiveDevice) {
    for (let i = this.segmentValues.length - 2; i < this.segmentValues.length; i++) {
      this.updateSegment(context, i, null);
    }
  }

  clearTime(context: MR_ActiveDevice) {
    for (let i = 0; i < this.segmentValues.length - 2; i++) {
      this.updateSegment(context, i, null);
    }
  }
}
