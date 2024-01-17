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
      fader.mSurfaceValue.mTouchState.bindTo(this.mTouchedShadowValue);
    }
  }

  mTouchedValue = this.surface.makeCustomValueVariable("faderTouched");

  bindToMidi = (ports: PortPair, channelIndex: number, { areMotorsActive }: GlobalState) => {
    const surfaceValue = this.fader.mSurfaceValue;

    surfaceValue.mMidiBinding.setInputPort(ports.input).bindToPitchBend(channelIndex);
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
        sendValue(context, surfaceValue.getProcessValue(context));
      }
    };

    areMotorsActive.addOnChangeCallback((context, areMotorsActive) => {
      if (areMotorsActive) {
        sendValue(context, surfaceValue.getProcessValue(context));
      }
    });

    const previousSurfaceValue = new ContextStateVariable(0);
    const onSurfaceValueChange = (context: MR_ActiveDevice, value: number) => {
      // The builtin `difference` parameter is zero in the beginning and when a fader was previously
      // unassigned. It's also not available when manually triggering this function, so we revert to
      // always computing `difference` ourselves:
      const difference = value - previousSurfaceValue.get(context);

      if (surfaceValue.getProcessValue(context) !== value) {
        console.log(`${true}`);
      }
      // Prevent identical messages to reduce fader noise
      if (
        areMotorsActive.get(context) &&
        !this.mTouchedShadowValue.getProcessValue(context) &&
        difference !== 0
      ) {
        sendValue(context, value);
      }

      previousSurfaceValue.set(context, value);
    };

    surfaceValue.mOnProcessValueChange = onSurfaceValueChange;

    // Send fader down when unassigned
    surfaceValue.mOnTitleChange = (context, _title1, title2) => {
      if (title2 === "") {
        surfaceValue.setProcessValue(context, 0);
        // `mOnProcessValueChange` isn't run on `setProcessValue()` when the fader is not assigned
        // to a mixer channel, so we manually trigger the update:
        onSurfaceValueChange(context, 0);
      }
    };
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
