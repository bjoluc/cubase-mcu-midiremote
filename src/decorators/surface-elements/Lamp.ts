import { EnhancedMidiOutput } from "/midi/PortPair";

class LampDecorator {
  constructor(private lamp: MR_Lamp) {}

  bindToNote = (output: EnhancedMidiOutput, note: number) => {
    this.lamp.mSurfaceValue.mOnProcessValueChange = (context, value) => {
      output.sendNoteOn(context, note, value);
    };
  };
}

/**
 * Extends the MR_Lamp by a `bindToNote()` method
 */
export class Lamp extends LampDecorator {
  constructor(surface: MR_DeviceSurface, x: number, y: number, w: number, h: number) {
    const lamp = surface.makeLamp(x, y, w, h);

    super(lamp);

    return Object.assign(lamp, this);
  }
}

// TS merges this declaration with the `Lamp` class above
export interface Lamp extends MR_Lamp {
  setShapeRectangle(): Lamp;
  setShapeCircle(): Lamp;
}
