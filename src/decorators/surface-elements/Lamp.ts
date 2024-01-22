import { MidiOutputPort } from "../MidiOutputPort";

class LampDecorator {
  constructor(private lamp: MR_Lamp) {}

  bindToNote = (output: MidiOutputPort, note: number) => {
    this.lamp.mSurfaceValue.mOnProcessValueChange = (context, value) => {
      output.sendNoteOn(context, note, value);
    };
  };
}

/**
 * Extends the MR_Lamp by a `bindToNote()` method
 */
export class Lamp extends LampDecorator {
  constructor(surface: MR_DeviceSurface, x?: number, y?: number, w?: number, h?: number) {
    const lamp: MR_Lamp =
      typeof x !== "undefined" &&
      typeof y !== "undefined" &&
      typeof w !== "undefined" &&
      typeof h !== "undefined"
        ? surface.makeLamp(x, y, w, h)
        : {
            mSurfaceValue: surface.makeCustomValueVariable("hiddenLamp"),
            setShapeCircle() {
              return lamp;
            },
            setShapeRectangle() {
              return lamp;
            },
          };

    super(lamp);

    return Object.assign(lamp, this);
  }
}

// TS merges this declaration with the `Lamp` class above
export interface Lamp extends MR_Lamp {
  setShapeCircle(): Lamp;
  setShapeRectangle(): Lamp;
}
