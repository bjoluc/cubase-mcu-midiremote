import { PortPair } from "/midi/PortPair";
import { GlobalState } from "/state";
import { ContextStateVariable } from "/util";

class TouchSensitiveFaderDecorator {
  // Workaround because `filterByValue` in the encoder bindings hides zero values from
  // `mOnProcessValueChange`
  private mTouchedShadowValue = this.surface.makeCustomValueVariable("faderTouchedShadow");

  constructor(
    private surface: MR_DeviceSurface,
    private fader: MR_Fader,
  ) {
    // Cubase 13 only:
    if (fader.mSurfaceValue.mTouchState) {
      fader.mSurfaceValue.mTouchState.bindTo(this.mTouchedValue);
    }
  }

  mTouchedValue = this.surface.makeCustomValueVariable("faderTouched");

  bindToMidi = (ports: PortPair, channelIndex: number, { areMotorsActive }: GlobalState) => {
    this.fader.mSurfaceValue.mMidiBinding.setInputPort(ports.input).bindToPitchBend(channelIndex);
    this.mTouchedValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, 104 + channelIndex);
    this.mTouchedShadowValue.mMidiBinding
      .setInputPort(ports.input)
      .bindToNote(0, 104 + channelIndex);

    const sendValue = (context: MR_ActiveDevice, value: number) => {
      value *= 0x3fff;
      ports.output.sendMidi(context, [0xe0 + channelIndex, value & 0x7f, value >> 7]);
    };

    this.mTouchedShadowValue.mOnProcessValueChange = (context, isFaderTouched) => {
      if (!isFaderTouched) {
        sendValue(context, lastFaderValue.get(context));
      }
    };

    const forceUpdate = new ContextStateVariable(true);
    const lastFaderValue = new ContextStateVariable(0);
    this.fader.mSurfaceValue.mOnProcessValueChange = (context, newValue, difference) => {
      // Prevent identical messages to reduce fader noise
      if (
        areMotorsActive.get(context) &&
        !this.mTouchedShadowValue.getProcessValue(context) &&
        (difference !== 0 || lastFaderValue.get(context) === 0 || forceUpdate.get(context))
      ) {
        forceUpdate.set(context, false);
        sendValue(context, newValue);
      }

      lastFaderValue.set(context, newValue);
    };

    // Set fader to `0` when unassigned
    this.fader.mSurfaceValue.mOnTitleChange = (context, title) => {
      if (title === "") {
        forceUpdate.set(context, true);
        this.fader.mSurfaceValue.setProcessValue(context, 0);
        // `mOnProcessValueChange` somehow isn't run here on `setProcessValue()`, hence:
        lastFaderValue.set(context, 0);
        if (areMotorsActive.get(context)) {
          forceUpdate.set(context, false);
          sendValue(context, 0);
        }
      }
    };

    areMotorsActive.addOnChangeCallback((context, areMotorsActive) => {
      if (areMotorsActive) {
        sendValue(context, lastFaderValue.get(context));
      }
    });
  };
}

export class TouchSensitiveFader extends TouchSensitiveFaderDecorator {
  constructor(surface: MR_DeviceSurface, x: number, y: number, w: number, h: number) {
    const fader = surface.makeFader(x, y, w, h);

    super(surface, fader);

    return Object.assign(fader, this);
  }
}

// TS merges this declaration with the `TouchSensitiveFader` class above
export interface TouchSensitiveFader extends MR_Fader {}
