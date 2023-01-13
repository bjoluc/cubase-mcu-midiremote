import { ColorManager } from "src/midi/ColorManager";
import { SurfaceElements } from "src/surface";

export function sendSysexMessage(
  midiOutput: MR_DeviceMidiOutput,
  context: MR_ActiveDevice,
  messageBody: any[]
) {
  midiOutput.sendMidi(context, [0xf0, 0x00, 0x00, 0x66, 0x14, ...messageBody, 0xf7]);
}

export function sendNoteOn(
  midiOutput: MR_DeviceMidiOutput,
  context: MR_ActiveDevice,
  channel: number,
  pitch: number,
  velocity: boolean
) {
  midiOutput.sendMidi(context, [0x90 + channel, pitch, velocity ? 0xff : 0x00]);
}

export function makeButtonValueChangeHandler(midiOutput: MR_DeviceMidiOutput, note: number) {
  return (context: MR_ActiveDevice, newValue: number, difference: number) => {
    if (difference !== 0) {
      sendNoteOn(midiOutput, context, 0, note, Boolean(newValue));
    }
  };
}

export function bindSurfaceElementsToMidi(
  elements: SurfaceElements,
  midiInput: MR_DeviceMidiInput,
  midiOutput: MR_DeviceMidiOutput
) {
  function setMidiPorts(binding: MR_SurfaceValueMidiBinding) {
    return binding.setInputPort(midiInput).setOutputPort(midiOutput);
  }

  const colorManager = new ColorManager(midiOutput);

  elements.channels.forEach((channel, index) => {
    setMidiPorts(channel.encoder.mEncoderValue.mMidiBinding)
      .bindToControlChange(0, 16 + index)
      .setTypeRelativeSignedBit();
    setMidiPorts(channel.encoder.mPushValue.mMidiBinding).bindToNote(0, 32 + index);

    channel.encoder.mEncoderValue.mOnColorChange = (context, r, g, b, _a, isColorAssigned) => {
      colorManager.setChannelColorRgb(context, index, r, g, b);
    };

    const buttons = channel.buttons;
    [buttons.record, buttons.solo, buttons.mute, buttons.select].forEach((button, row) => {
      const note = row * 8 + index;
      setMidiPorts(button.mSurfaceValue.mMidiBinding).bindToNote(0, note);
      button.mSurfaceValue.mOnProcessValueChange = makeButtonValueChangeHandler(midiOutput, note);
    });

    setMidiPorts(channel.fader.mSurfaceValue.mMidiBinding).bindToPitchBend(index);
    channel.fader.mSurfaceValue.mOnProcessValueChange = (context, newValue, difference) => {
      if (difference !== 0) {
        console.log(`${difference}`);
        newValue *= 0x3fff;
        var lowByte = newValue & 0x7f;
        var highByte = newValue >> 7;

        midiOutput.sendMidi(context, [0xe0 + index, lowByte, highByte]);
      }
    };

    channel.faderTouched.mMidiBinding.setInputPort(midiInput).bindToNote(0, 104 + index);
  });
}
