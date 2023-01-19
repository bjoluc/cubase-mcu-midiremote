import { SurfaceElements } from "src/surface";
import { MidiManagers } from "./managers";
import { LcdManager } from "./managers/LcdManager";

export enum EncoderDisplayMode {
  SingleDot = 0,
  BoostOrCut = 1,
  Wrap = 2,
  Spread = 3,
}

export function sendSysexMessage(
  midiOutput: MR_DeviceMidiOutput,
  context: MR_ActiveDevice,
  messageBody: any[]
) {
  midiOutput.sendMidi(context, [0xf0, 0x00, 0x00, 0x66, 0x14, ...messageBody, 0xf7]);
}

function sendNoteOn(
  midiOutput: MR_DeviceMidiOutput,
  context: MR_ActiveDevice,
  channel: number,
  pitch: number,
  velocity: boolean
) {
  midiOutput.sendMidi(context, [0x90 + channel, pitch, +velocity * 0xff]);
}

export function bindSurfaceElementsToMidi(
  elements: SurfaceElements,
  midiInput: MR_DeviceMidiInput,
  midiOutput: MR_DeviceMidiOutput,
  managers: MidiManagers
) {
  function bindButton(button: MR_Button, note: number) {
    button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToNote(0, note);
    button.mSurfaceValue.mOnProcessValueChange = (context, newValue, difference) => {
      sendNoteOn(midiOutput, context, 0, note, Boolean(newValue));
    };
  }

  function bindFader(fader: MR_Fader, faderIndex: number) {
    fader.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToPitchBend(faderIndex);
    fader.mSurfaceValue.mOnProcessValueChange = (context, newValue, difference) => {
      if (difference !== 0) {
        newValue *= 0x3fff;
        var lowByte = newValue & 0x7f;
        var highByte = newValue >> 7;

        midiOutput.sendMidi(context, [0xe0 + faderIndex, lowByte, highByte]);
      }
    };
  }

  elements.channels.forEach((channel, index) => {
    // Push Encoder
    channel.encoder.mEncoderValue.mMidiBinding
      .setInputPort(midiInput)
      .bindToControlChange(0, 16 + index)
      .setTypeRelativeSignedBit();
    channel.encoder.mPushValue.mMidiBinding.setInputPort(midiInput).bindToNote(0, 32 + index);
    channel.encoder.mEncoderValue.mOnProcessValueChange = (context, newValue) => {
      const displayMode = channel.encoderDisplayMode.getProcessValue(context);

      const isCenterLedOn = newValue === (displayMode === EncoderDisplayMode.Spread ? 0 : 0.5);
      const position =
        1 + Math.round(newValue * (displayMode === EncoderDisplayMode.Spread ? 5 : 10));

      midiOutput.sendMidi(context, [
        0xb0,
        0x30 + index,
        (+isCenterLedOn << 6) + (displayMode << 4) + position,
      ]);
    };

    channel.encoder.mEncoderValue.mOnColorChange = (context, r, g, b, _a, isColorAssigned) => {
      managers.color.setChannelColorRgb(context, index, r, g, b);
    };

    // Scribble Strip
    [channel.scribbleStrip.row1, channel.scribbleStrip.row2].forEach((scribbleStripText, row) => {
      scribbleStripText.mOnTitleChange = (context, title) => {
        managers.lcd.setChannelText(context, row, index, LcdManager.abbreviateString(title));
      };
    });

    // VU Meter
    let lastMeterUpdateTime = 0;
    channel.vuMeter.mOnProcessValueChange = (context, newValue) => {
      // @ts-ignore `performance` exists in the runtime environment
      const now: number = performance.now(); // ms

      if (now - lastMeterUpdateTime > 125) {
        lastMeterUpdateTime = now;
        midiOutput.sendMidi(context, [0xd0, (index << 4) + Math.round(newValue * 14)]);
      }
    };

    // Buttons
    const buttons = channel.buttons;
    [buttons.record, buttons.solo, buttons.mute, buttons.select].forEach((button, row) => {
      bindButton(button, row * 8 + index);
    });

    // Fader
    bindFader(channel.fader, index);
    channel.faderTouched.mMidiBinding.setInputPort(midiInput).bindToNote(0, 104 + index);
  });

  bindFader(elements.control.mainFader, 8);
  elements.control.mainFaderTouched.mMidiBinding.setInputPort(midiInput).bindToNote(0, 104 + 8);

  const buttons = elements.control.buttons;

  [
    ...[0, 3, 1, 4, 2, 5].map((index) => buttons.encoderAssign[index]),
    buttons.navigation.bank.left,
    buttons.navigation.bank.right,
    buttons.navigation.channel.left,
    buttons.navigation.channel.right,
    buttons.flip,
    buttons.edit,
    buttons.display,
    buttons.timeMode,
    ...buttons.function,
    ...buttons.number,
    ...buttons.modify,
    ...buttons.automation,
    ...buttons.utility,
    ...buttons.transport,
    buttons.navigation.directions.up,
    buttons.navigation.directions.down,
    buttons.navigation.directions.left,
    buttons.navigation.directions.right,
    buttons.navigation.directions.center,
    buttons.scrub,
  ].forEach((button, index) => {
    bindButton(button, 40 + index);
  });

  buttons.navigation.directions.centerLed.mMidiBinding.setOutputPort(midiOutput);
  buttons.navigation.directions.centerLed.mOnProcessValueChange = (context, value) => {
    sendNoteOn(midiOutput, context, 0, 100, Boolean(value));
  };

  // Display
  elements.display.onTimeUpdated = (context, time) => {
    managers.segmentDisplay.setTimeString(context, time);
  };

  elements.display.smpteLed.mMidiBinding.setOutputPort(midiOutput).bindToNote(0, 0x71);
  elements.display.beatsLed.mMidiBinding.setOutputPort(midiOutput).bindToNote(0, 0x72);
  elements.display.soloLed.mMidiBinding.setOutputPort(midiOutput).bindToNote(0, 0x73);
}
