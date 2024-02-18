import { RelativeSignedBitCCHandler } from "/midi/RelativeSignedBitCCHandler";

class JogWheelDecorator {
  private differenceReceiver = new RelativeSignedBitCCHandler(this.surface);

  constructor(
    private surface: MR_DeviceSurface,
    private knob: MR_Knob,
  ) {}

  mKnobModeEnabledValue = this.surface.makeCustomValueVariable("jogWheelKnobModeEnabled");
  mJogRightValue = this.surface.makeCustomValueVariable("jogWheelJogRight");
  mJogLeftValue = this.surface.makeCustomValueVariable("jogWheelJogLeft");

  bindToControlChange = (input: MR_DeviceMidiInput, controlChangeNumber: number) => {
    this.differenceReceiver.bindToCC(input, controlChangeNumber);

    this.differenceReceiver.onDifferenceReceived = (context, difference, integerDifference) => {
      if (this.mKnobModeEnabledValue.getProcessValue(context)) {
        this.knob.mSurfaceValue.setProcessValue(
          context,
          Math.max(0, Math.min(1, this.knob.mSurfaceValue.getProcessValue(context) + difference)),
        );
      } else {
        // Handle jog events
        if (integerDifference !== 0) {
          if (integerDifference < 0) {
            this.mJogLeftValue.setProcessValue(context, 1);
          } else {
            this.mJogRightValue.setProcessValue(context, 1);
          }
        }
      }
    };
  };
}

/**
 * Handles a jog wheel by extending an MR_Knob
 */
export class JogWheel extends JogWheelDecorator {
  constructor(surface: MR_DeviceSurface, x: number, y: number, w: number, h: number) {
    const knob = surface.makeKnob(x, y, w, h);

    super(surface, knob);

    return Object.assign(knob, this);
  }
}

// TS merges this declaration with the `JogWheel` class above
export interface JogWheel extends MR_Knob {}
