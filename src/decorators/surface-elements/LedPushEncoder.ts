import { MidiPortPair } from "/midi/MidiPortPair";
import { ObservableContextStateVariable, makeCallbackCollection } from "/util";

export enum EncoderDisplayMode {
  SingleDot = 0,
  BoostOrCut = 1,
  Wrap = 2,
  Spread = 3,
}

class LedPushEncoderDecorator {
  constructor(
    private surface: MR_DeviceSurface,
    private encoder: MR_PushEncoder,
  ) {}

  displayMode = new ObservableContextStateVariable(EncoderDisplayMode.SingleDot);

  mOnEncoderValueTitleChange = makeCallbackCollection(this.encoder.mEncoderValue, "mOnTitleChange");

  bindToMidi = (ports: MidiPortPair, channelIndex: number) => {
    this.encoder.mEncoderValue.mMidiBinding
      .setInputPort(ports.input)
      .bindToControlChange(0, 16 + channelIndex)
      .setTypeRelativeSignedBit();

    this.encoder.mPushValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, 32 + channelIndex);

    this.encoder.mEncoderValue.mOnProcessValueChange = (context, value) => {
      const displayMode = this.displayMode.get(context);

      const isCenterLedOn = value === (displayMode === EncoderDisplayMode.Spread ? 0 : 0.5);
      const position = 1 + Math.round(value * (displayMode === EncoderDisplayMode.Spread ? 5 : 10));

      ports.output.sendMidi(context, [
        0xb0,
        0x30 + channelIndex,
        (+isCenterLedOn << 6) + (displayMode << 4) + position,
      ]);
    };

    // Reset encoder LED ring when encoder becomes unassigned
    this.mOnEncoderValueTitleChange.addCallback((context, title) => {
      if (title === "") {
        ports.output.sendMidi(context, [0xb0, 0x30 + channelIndex, 0]);
      }
    });
  };
}

/**
 * Extends the MR_PushEncoder by LED ring handling
 */
export class LedPushEncoder extends LedPushEncoderDecorator {
  constructor(surface: MR_DeviceSurface, x: number, y: number, w: number, h: number) {
    const encoder = surface.makePushEncoder(x, y, w, h);

    super(surface, encoder);

    return Object.assign(encoder, this);
  }
}

// TS merges this declaration with the `LedPushEncoder` class above
export interface LedPushEncoder extends MR_PushEncoder {
  setControlLayer(controlLayer: MR_ControlLayer): LedPushEncoder;
}
