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
  velocity: number | boolean
) {
  midiOutput.sendMidi(context, [0x90 + channel, pitch, +Boolean(velocity) * 0xff]);
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
      sendNoteOn(midiOutput, context, 0, note, newValue);
    };
  }

  function bindLamp(lamp: MR_Lamp, note: number) {
    lamp.mSurfaceValue.mOnProcessValueChange = (context, newValue, difference) => {
      sendNoteOn(midiOutput, context, 0, note, newValue);
    };
  }

  function bindFader(fader: MR_Fader, faderIndex: number) {
    fader.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToPitchBend(faderIndex);

    let isInitialChangeEvent = true;
    fader.mSurfaceValue.mOnProcessValueChange = (context, newValue, difference) => {
      if (difference !== 0 || isInitialChangeEvent) {
        isInitialChangeEvent = false;

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

  buttons.navigation.directions.centerLed.mOnProcessValueChange = (context, value) => {
    sendNoteOn(midiOutput, context, 0, 100, value);
  };
  buttons.scrubLed.mOnProcessValueChange = (context, value) => {
    sendNoteOn(midiOutput, context, 0, 0x65, value);
  };

  // Display
  const displayLeds = elements.display.leds;
  [displayLeds.smpte, displayLeds.beats, displayLeds.solo].forEach((lamp, index) => {
    bindLamp(lamp, 0x71 + index);
  });

  let lastTimeFormat = "";
  let isInitialized = false;
  elements.display.onTimeUpdated = (context, time, timeFormat) => {
    const hasTimeFormatChanged = timeFormat !== lastTimeFormat;
    if (hasTimeFormatChanged) {
      lastTimeFormat = timeFormat;
    }

    const isTimeFormatSupported =
      timeFormat === "Bars+Beats" ||
      timeFormat === "Timecode" ||
      timeFormat === "60 fps (User)" ||
      timeFormat === "Seconds";

    if (isTimeFormatSupported) {
      managers.segmentDisplay.setTimeString(context, time);
    }

    if (hasTimeFormatChanged)
      if (!isTimeFormatSupported) {
        managers.segmentDisplay.clearAllSegments(context);
      }

    // Adapt time mode LEDs to time format
    if (!isInitialized) {
      // Using `setProcessValue` on initialization somehow crashes the host, so we don't do it on
      // initialization.
      isInitialized = true;
    } else {
      elements.display.leds.smpte.mSurfaceValue.setProcessValue(
        context,
        +(timeFormat === "Timecode" || timeFormat === "60 fps (User)")
      );
      elements.display.leds.beats.mSurfaceValue.setProcessValue(
        context,
        +(timeFormat === "Bars+Beats")
      );
    }
  };

  // Jog wheel
  const jogWheelValue = elements.control.jogWheel.mSurfaceValue;
  jogWheelValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToControlChange(0, 0x3c)
    .setTypeRelativeSignedBit();
  jogWheelValue.mOnProcessValueChange = (context, value, difference) => {
    const jumpOffset = 0.4;

    // Prevent value from reaching its limits
    if (value < 0.5 - jumpOffset) {
      jogWheelValue.setProcessValue(context, value + jumpOffset);
    } else if (value > 0.5 + jumpOffset) {
      jogWheelValue.setProcessValue(context, value - jumpOffset);
    }

    // Compensate for the difference value offsets introduced above
    if (Math.abs(difference) >= jumpOffset - 0.1) {
      if (difference > 0) {
        difference -= jumpOffset;
      } else {
        difference += jumpOffset;
      }
    }

    // Handle jog events
    if (difference !== 0) {
      const isLeftJog = difference < 0;
      if (isLeftJog) {
        elements.control.jogLeft.setProcessValue(context, 1);
      } else {
        elements.control.jogRight.setProcessValue(context, 1);
      }
    }
  };
}
