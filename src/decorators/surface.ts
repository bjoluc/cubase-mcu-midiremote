import { EnhancedMidiOutput, PortPair } from "../midi/PortPair";
import { CallbackCollection, createElements } from "../util";
import { enhanceButtonToLedButton } from "./button";

export interface LedButton extends MR_Button {
  mLedValue: MR_SurfaceCustomValueVariable;
  onSurfaceValueChange: CallbackCollection<
    Parameters<MR_Button["mSurfaceValue"]["mOnProcessValueChange"]>
  >;
  bindToNote: (ports: PortPair, note: number, isChannelButton?: boolean) => void;
}

export interface LedPushEncoder extends MR_PushEncoder {
  mDisplayModeValue: MR_SurfaceCustomValueVariable;
}

export interface TouchSensitiveFader extends MR_Fader {
  mTouchedValue: MR_SurfaceCustomValueVariable;
  mTouchedValueInternal: MR_SurfaceCustomValueVariable;
}

export interface JogWheel extends MR_Fader {
  mKnobModeEnabledValue: MR_SurfaceCustomValueVariable;
  mJogRightValue: MR_SurfaceCustomValueVariable;
  mFastJogRightValue: MR_SurfaceCustomValueVariable;
  mJogLeftValue: MR_SurfaceCustomValueVariable;
  mFastJogLeftValue: MR_SurfaceCustomValueVariable;
  bindToControlChange: (input: MR_DeviceMidiInput, controlChangeNumber: number) => void;
}

export interface DecoratedLamp extends MR_Lamp {
  bindToNote: (output: EnhancedMidiOutput, note: number) => void;
}

export interface DecoratedDeviceSurface extends MR_DeviceSurface {
  makeLedButton: (...args: Parameters<MR_DeviceSurface["makeButton"]>) => LedButton;

  /**
   * Creates a mock LedButton that doesn't have a surface element, but uses a `customValueVariable`
   * internally. While it's typed as a button for convenience, it doesn't implement all the button
   * methods, like `setTypeToggle()` and friends.
   */
  makeHiddenLedButton: () => LedButton;
  makeHiddenLedButtons: (numberOfButtons: number) => LedButton[];
  makeLedPushEncoder: (...args: Parameters<MR_DeviceSurface["makePushEncoder"]>) => LedPushEncoder;
  makeTouchSensitiveFader: (
    ...args: Parameters<MR_DeviceSurface["makeFader"]>
  ) => TouchSensitiveFader;
  makeJogWheel: (...args: Parameters<MR_DeviceSurface["makeKnob"]>) => JogWheel;
  makeDecoratedLamp: (...args: Parameters<MR_DeviceSurface["makeLamp"]>) => DecoratedLamp;
}

export function decorateSurface(surface: MR_DeviceSurface) {
  const decoratedSurface = surface as DecoratedDeviceSurface;

  decoratedSurface.makeLedButton = (...args) =>
    enhanceButtonToLedButton(surface.makeButton(...args), surface);

  decoratedSurface.makeHiddenLedButton = () =>
    enhanceButtonToLedButton(
      { mSurfaceValue: surface.makeCustomValueVariable("HiddenLedButton") } as MR_Button,
      surface
    );

  decoratedSurface.makeHiddenLedButtons = (numberOfButtons) =>
    createElements(numberOfButtons, () => decoratedSurface.makeHiddenLedButton());

  decoratedSurface.makeLedPushEncoder = (...args) => {
    const encoder = surface.makePushEncoder(...args) as LedPushEncoder;
    encoder.mDisplayModeValue = surface.makeCustomValueVariable("encoderDisplayMode");
    return encoder;
  };

  decoratedSurface.makeTouchSensitiveFader = (...args) => {
    const fader = surface.makeFader(...args) as TouchSensitiveFader;

    fader.mTouchedValue = surface.makeCustomValueVariable("faderTouched");
    // Workaround because `filterByValue` in the encoder bindings hides zero values from
    // `mOnProcessValueChange`
    fader.mTouchedValueInternal = surface.makeCustomValueVariable("faderTouchedInternal");

    // Cubase 13 only:
    if (fader.mSurfaceValue.mTouchState) {
      fader.mSurfaceValue.mTouchState.bindTo(fader.mTouchedValue);
    }

    return fader;
  };

  decoratedSurface.makeJogWheel = (...args) => {
    const jogWheel = surface.makeKnob(...args) as JogWheel;

    const mProxyValue = surface.makeCustomValueVariable("jogWheelProxy");
    jogWheel.mKnobModeEnabledValue = surface.makeCustomValueVariable("jogWheelKnobModeEnabled");
    jogWheel.mJogRightValue = surface.makeCustomValueVariable("jogWheelJogRight");
    jogWheel.mFastJogRightValue = surface.makeCustomValueVariable("jogWheelFastJogRight");
    jogWheel.mJogLeftValue = surface.makeCustomValueVariable("jogWheelJogLeft");
    jogWheel.mFastJogLeftValue = surface.makeCustomValueVariable("jogWheelFastJogLeft");

    jogWheel.bindToControlChange = (input, controlChangeNumber) => {
      mProxyValue.mMidiBinding
        .setInputPort(input)
        .bindToControlChange(0, controlChangeNumber)
        .setTypeRelativeSignedBit();
      mProxyValue.mOnProcessValueChange = (context, value, difference) => {
        const jumpOffset = 0.4;

        // Prevent value from reaching its limits
        if (value < 0.5 - jumpOffset) {
          mProxyValue.setProcessValue(context, value + jumpOffset);
        } else if (value > 0.5 + jumpOffset) {
          mProxyValue.setProcessValue(context, value - jumpOffset);
        }

        // Compensate for the difference value offsets introduced above
        if (Math.abs(difference) >= jumpOffset - 0.1) {
          if (difference > 0) {
            difference -= jumpOffset;
          } else {
            difference += jumpOffset;
          }
        }

        if (jogWheel.mKnobModeEnabledValue.getProcessValue(context)) {
          jogWheel.mSurfaceValue.setProcessValue(
            context,
            Math.max(0, Math.min(1, jogWheel.mSurfaceValue.getProcessValue(context) + difference))
          );
        } else {
          // Handle jog events
          if (difference !== 0) {
            if (difference < 0) {
              if (difference < -0.014) {
                jogWheel.mFastJogLeftValue.setProcessValue(context, 1);
              } else {
                jogWheel.mJogLeftValue.setProcessValue(context, 1);
              }
            } else {
              if (difference > 0.014) {
                jogWheel.mFastJogRightValue.setProcessValue(context, 1);
              } else {
                jogWheel.mJogRightValue.setProcessValue(context, 1);
              }
            }
          }
        }
      };
    };

    return jogWheel;
  };

  decoratedSurface.makeDecoratedLamp = (...args) => {
    const lamp = decoratedSurface.makeLamp(...args) as DecoratedLamp;

    lamp.bindToNote = (output, note) => {
      lamp.mSurfaceValue.mOnProcessValueChange = (context, value) => {
        output.sendNoteOn(context, note, value);
      };
    };

    return lamp;
  };

  return decoratedSurface;
}
