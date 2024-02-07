import { MidiOutputPort } from "../MidiOutputPort";

interface LampOptions {
  /**
   * The position and size of the lamp. If omitted, the lamp will be hidden.
   */
  position?: [x: number, y: number, w: number, h: number];
}

class LampDecorator {
  constructor(private lamp: MR_Lamp) {}

  bindToNote = (output: MidiOutputPort, note: number) => {
    this.lamp.mSurfaceValue.mOnProcessValueChange = (context, value) => {
      output.sendNoteOn(context, note, value);
    };
  };
}

/**
 * Extends the MR_Lamp by a `bindToNote()` method and makes it hidable
 */
export class Lamp extends LampDecorator {
  constructor(surface: MR_DeviceSurface, options: LampOptions = {}) {
    const lamp: MR_Lamp = options.position
      ? surface.makeLamp(...options.position)
      : {
          mSurfaceValue: surface.makeCustomValueVariable("HiddenLamp"),
          setShapeCircle: () => lamp,
          setShapeRectangle: () => lamp,
        };

    super(lamp);

    return Object.assign(lamp, this);
  }
}

// TS merges this declaration with the `Lamp` class above
export interface Lamp extends MR_Lamp {
  setShapeRectangle(): Lamp;
  setShapeCircle(): Lamp;
}
