class JogWheelDecorator {
  private mProxyValue = this.surface.makeCustomValueVariable("jogWheelProxy");

  constructor(
    private surface: MR_DeviceSurface,
    private knob: MR_Knob,
  ) {}

  mKnobModeEnabledValue = this.surface.makeCustomValueVariable("jogWheelKnobModeEnabled");
  mJogRightValue = this.surface.makeCustomValueVariable("jogWheelJogRight");
  mJogLeftValue = this.surface.makeCustomValueVariable("jogWheelJogLeft");

  bindToControlChange = (input: MR_DeviceMidiInput, controlChangeNumber: number) => {
    this.mProxyValue.mMidiBinding
      .setInputPort(input)
      .bindToControlChange(0, controlChangeNumber)
      .setTypeRelativeSignedBit();

    this.mProxyValue.mOnProcessValueChange = (context, value, difference) => {
      const jumpOffset = 0.4;

      // Prevent value from reaching its limits
      if (value < 0.5 - jumpOffset) {
        this.mProxyValue.setProcessValue(context, value + jumpOffset);
      } else if (value > 0.5 + jumpOffset) {
        this.mProxyValue.setProcessValue(context, value - jumpOffset);
      }

      // Compensate for the difference value offsets introduced above
      if (Math.abs(difference) >= jumpOffset - 0.1) {
        if (difference > 0) {
          difference -= jumpOffset;
        } else {
          difference += jumpOffset;
        }
      }

      if (this.mKnobModeEnabledValue.getProcessValue(context)) {
        this.knob.mSurfaceValue.setProcessValue(
          context,
          Math.max(0, Math.min(1, this.knob.mSurfaceValue.getProcessValue(context) + difference)),
        );
      } else {
        // Handle jog events
        if (difference !== 0) {
          if (difference < 0) {
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
