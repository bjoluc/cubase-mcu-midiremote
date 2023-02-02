import { CallbackCollection, makeCallbackCollection } from "../util";

export interface LedButton extends MR_Button {
  mLedValue: MR_SurfaceCustomValueVariable;
  mProxyValue: MR_SurfaceCustomValueVariable;
  onSurfaceValueChange: CallbackCollection<
    Parameters<MR_Button["mSurfaceValue"]["mOnProcessValueChange"]>
  >;
}

export interface LedPushEncoder extends MR_PushEncoder {
  mDisplayModeValue: MR_SurfaceCustomValueVariable;
}

export interface TouchSensitiveFader extends MR_Fader {
  mTouchedValue: MR_SurfaceCustomValueVariable;
  mTouchedValueInternal: MR_SurfaceCustomValueVariable;
}

export interface JogWheel extends MR_Fader {
  mProxyValue: MR_SurfaceCustomValueVariable;
  mKnobModeEnabledValue: MR_SurfaceCustomValueVariable;
  mJogRightValue: MR_SurfaceCustomValueVariable;
  mJogLeftValue: MR_SurfaceCustomValueVariable;
}

export interface DecoratedDeviceSurface extends MR_DeviceSurface {
  makeLedButton: (...args: Parameters<MR_DeviceSurface["makeButton"]>) => LedButton;
  makeLedPushEncoder: (...args: Parameters<MR_DeviceSurface["makePushEncoder"]>) => LedPushEncoder;
  makeTouchSensitiveFader: (
    ...args: Parameters<MR_DeviceSurface["makeFader"]>
  ) => TouchSensitiveFader;
  makeJogWheel: (...args: Parameters<MR_DeviceSurface["makeKnob"]>) => JogWheel;
}

export function decorateSurface(surface: MR_DeviceSurface) {
  const decoratedSurface = surface as DecoratedDeviceSurface;

  decoratedSurface.makeLedButton = (...args) => {
    const button = surface.makeButton(...args) as LedButton;

    button.onSurfaceValueChange = makeCallbackCollection(
      button.mSurfaceValue,
      "mOnProcessValueChange"
    );
    button.mLedValue = surface.makeCustomValueVariable("LedButtonLed");
    button.mProxyValue = surface.makeCustomValueVariable("LedButtonProxy");

    return button;
  };

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

    return fader;
  };

  decoratedSurface.makeJogWheel = (...args) => {
    const jogWheel = surface.makeKnob(...args) as JogWheel;

    jogWheel.mProxyValue = surface.makeCustomValueVariable("jogWheelProxy");
    jogWheel.mKnobModeEnabledValue = surface.makeCustomValueVariable("jogWheelKnobModeEnabled");
    jogWheel.mJogRightValue = surface.makeCustomValueVariable("jogWheelJogRight");
    jogWheel.mJogLeftValue = surface.makeCustomValueVariable("jogWheelJogLeft");

    return jogWheel;
  };

  return decoratedSurface;
}
