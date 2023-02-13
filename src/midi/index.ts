import { SurfaceElements } from "../surface";
import { LedButton, TouchSensitiveFader } from "../decorators/surface";
import { ContextStateVariable, makeCallbackCollection, TimerUtils } from "../util";
import { ActivationCallbacks } from "./connection";
import { MidiManagers } from "./managers";
import { LcdManager } from "./managers/LcdManager";
import { MidiPorts, PortPair } from "./MidiPorts";

export enum EncoderDisplayMode {
  SingleDot = 0,
  BoostOrCut = 1,
  Wrap = 2,
  Spread = 3,
}

function bindLedButton(ports: PortPair, button: LedButton, note: number, isChannelButton = false) {
  const currentSurfaceValue = new ContextStateVariable(0);
  button.mSurfaceValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, note);

  button.onSurfaceValueChange.addCallback((context, newValue) => {
    currentSurfaceValue.set(context, newValue);
    ports.output.sendNoteOn(context, note, newValue || currentLedValue.get(context));
  });

  const currentLedValue = new ContextStateVariable(0);
  button.mLedValue.mOnProcessValueChange = (context, newValue) => {
    currentLedValue.set(context, newValue);
    ports.output.sendNoteOn(context, note, newValue);
  };

  button.mProxyValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, note);
  button.mProxyValue.mOnProcessValueChange = (context, newValue) => {
    ports.output.sendNoteOn(
      context,
      note,
      newValue || currentSurfaceValue.get(context) || currentLedValue.get(context)
    );
  };

  if (isChannelButton) {
    // Disable button when channel becomes unassigned
    button.mSurfaceValue.mOnTitleChange = (context, title) => {
      if (title === "") {
        ports.output.sendNoteOn(context, note, 0);
      }
    };
  }
}

function bindLamp(ports: PortPair, lamp: MR_Lamp, note: number) {
  lamp.mSurfaceValue.mOnProcessValueChange = (context, newValue, difference) => {
    ports.output.sendNoteOn(context, note, newValue);
  };
}

export function bindSurfaceElementsToMidi(
  elements: SurfaceElements,
  ports: MidiPorts,
  managers: MidiManagers,
  activationCallbacks: ActivationCallbacks,
  { setTimeout }: TimerUtils
) {
  const buttons = elements.control.buttons;

  const motorButton = buttons.automation[5];

  const areMotorsActive = new ContextStateVariable(true);
  motorButton.onSurfaceValueChange.addCallback((context, value) => {
    if (value === 1) {
      const areMotorsActiveValue = !areMotorsActive.get(context);
      areMotorsActive.set(context, areMotorsActiveValue);
      motorButton.mLedValue.setProcessValue(context, +areMotorsActiveValue);
    }
  });
  activationCallbacks.addCallback((context) => {
    // TODO `mOnProcessValueChange` is not executed here – why?
    motorButton.mLedValue.setProcessValue(context, 1);
    // Workaround:
    const output = ports.getMainPorts().output;
    output.sendNoteOn(context, 0x4f, 1);

    // Workaround for encoder assign buttons not being enabled on activation
    // (https://forums.steinberg.net/t/831123):
    output.sendNoteOn(context, 0x2a, 1);
    for (const note of [0x28, 0x29, 0x2b, 0x2c, 0x2d]) {
      output.sendNoteOn(context, note, 0);
    }
  });

  function bindFader(ports: PortPair, fader: TouchSensitiveFader, faderIndex: number) {
    fader.mSurfaceValue.mMidiBinding.setInputPort(ports.input).bindToPitchBend(faderIndex);
    fader.mTouchedValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, 104 + faderIndex);
    fader.mTouchedValueInternal.mMidiBinding
      .setInputPort(ports.input)
      .bindToNote(0, 104 + faderIndex);

    const sendValue = (context: MR_ActiveDevice, value: number) => {
      value *= 0x3fff;
      ports.output.sendMidi(context, [0xe0 + faderIndex, value & 0x7f, value >> 7]);
    };

    const isFaderTouched = new ContextStateVariable(false);
    fader.mTouchedValueInternal.mOnProcessValueChange = (context, value) => {
      const isFaderTouchedValue = Boolean(value);
      isFaderTouched.set(context, isFaderTouchedValue);
      if (!isFaderTouchedValue) {
        sendValue(context, lastFaderValue.get(context));
      }
    };

    const forceUpdate = new ContextStateVariable(true);
    const lastFaderValue = new ContextStateVariable(0);
    fader.mSurfaceValue.mOnProcessValueChange = (context, newValue, difference) => {
      // Prevent identical messages to reduce fader noise
      if (
        areMotorsActive.get(context) &&
        !isFaderTouched.get(context) &&
        (difference !== 0 || lastFaderValue.get(context) === 0 || forceUpdate.get(context))
      ) {
        forceUpdate.set(context, false);
        sendValue(context, newValue);
      }

      lastFaderValue.set(context, newValue);
    };

    // Set fader to `0` when unassigned
    fader.mSurfaceValue.mOnTitleChange = (context, title) => {
      if (title === "") {
        forceUpdate.set(context, true);
        fader.mSurfaceValue.setProcessValue(context, 0);
        // `mOnProcessValueChange` somehow isn't run here on `setProcessValue()`, hence:
        lastFaderValue.set(context, 0);
        if (areMotorsActive.get(context)) {
          forceUpdate.set(context, false);
          sendValue(context, 0);
        }
      }
    };

    motorButton.onSurfaceValueChange.addCallback((context) => {
      if (areMotorsActive.get(context)) {
        sendValue(context, lastFaderValue.get(context));
      }
    });
  }

  const onNameValueDisplayModeChange = makeCallbackCollection(
    elements.display.isValueModeActive,
    "mOnProcessValueChange"
  );

  elements.channels.forEach((channel, index) => {
    const channelPorts = ports.getPortsByChannelIndex(index);

    // Push Encoder
    channel.encoder.mEncoderValue.mMidiBinding
      .setInputPort(channelPorts.input)
      .bindToControlChange(0, 16 + (index % 8))
      .setTypeRelativeSignedBit();
    channel.encoder.mPushValue.mMidiBinding
      .setInputPort(channelPorts.input)
      .bindToNote(0, 32 + (index % 8));
    channel.encoder.mEncoderValue.mOnProcessValueChange = (context, newValue) => {
      const displayMode = channel.encoder.mDisplayModeValue.getProcessValue(context);

      const isCenterLedOn = newValue === (displayMode === EncoderDisplayMode.Spread ? 0 : 0.5);
      const position =
        1 + Math.round(newValue * (displayMode === EncoderDisplayMode.Spread ? 5 : 10));

      channelPorts.output.sendMidi(context, [
        0xb0,
        0x30 + (index % 8),
        (+isCenterLedOn << 6) + (displayMode << 4) + position,
      ]);
    };

    const encoderColor = new ContextStateVariable({ isAssigned: false, r: 0, g: 0, b: 0 });
    channel.encoder.mEncoderValue.mOnColorChange = (context, r, g, b, _a, isAssigned) => {
      encoderColor.set(context, { isAssigned, r, g, b });
      updateColor(context);
    };

    const channelColor = new ContextStateVariable({ isAssigned: false, r: 0, g: 0, b: 0 });
    channel.buttons.select.mSurfaceValue.mOnColorChange = (context, r, g, b, _a, isAssigned) => {
      channelColor.set(context, { isAssigned, r, g, b });
      updateColor(context);
    };

    const updateColor = (context: MR_ActiveDevice) => {
      const currentEncoderColor = encoderColor.get(context);
      managers.color.setChannelColorRgb(
        context,
        index,
        // Fall back to channel color if encoder is not assigned
        currentEncoderColor.isAssigned ? currentEncoderColor : channelColor.get(context)
      );
    };

    // Scribble Strip
    const currentParameterName = new ContextStateVariable("");
    const currentDisplayValue = new ContextStateVariable("");
    const isLocalValueModeActive = new ContextStateVariable(false);

    const updateDisplay = (context: MR_ActiveDevice) => {
      managers.lcd.setChannelText(
        context,
        0,
        index,
        isLocalValueModeActive.get(context) ||
          elements.display.isValueModeActive.getProcessValue(context)
          ? currentDisplayValue.get(context)
          : currentParameterName.get(context)
      );
    };
    channel.encoder.mEncoderValue.mOnDisplayValueChange = (context, value) => {
      currentDisplayValue.set(context, LcdManager.centerString(LcdManager.abbreviateString(value)));
      isLocalValueModeActive.set(context, true);
      updateDisplay(context);
      setTimeout(
        context,
        `updateDisplay${index}`,
        (context) => {
          isLocalValueModeActive.set(context, false);
          updateDisplay(context);
        },
        1
      );
    };
    channel.encoder.mEncoderValue.mOnTitleChange = (context, title1, title2) => {
      // Reset encoder LED ring when channel becomes unassigned
      if (title1 === "") {
        channelPorts.output.sendMidi(context, [0xb0, 0x30 + (index % 8), 0]);
      }

      // Luckily, `mOnTitleChange` runs after `mOnDisplayValueChange`, so setting
      // `isLocalValueModeActive` to `false` here overwrites the `true` set by
      // `mOnDisplayValueChange`
      isLocalValueModeActive.set(context, false);

      title2 =
        {
          "Pan Left-Right": "Pan",
          "Pan links/rechts": "Pan",
        }[title2] ?? title2;

      currentParameterName.set(
        context,
        LcdManager.centerString(LcdManager.abbreviateString(title2))
      );
      updateDisplay(context);
    };

    onNameValueDisplayModeChange.addCallback(updateDisplay);

    channel.scribbleStrip.trackTitle.mOnTitleChange = (context, title) => {
      managers.lcd.setChannelText(context, 1, index, LcdManager.abbreviateString(title));
    };

    // VU Meter
    let lastMeterUpdateTime = 0;
    channel.vuMeter.mOnProcessValueChange = (context, newValue) => {
      const now: number = performance.now(); // ms

      if (now - lastMeterUpdateTime > 125) {
        // Apply a log scale twice to make the meters look more like Cubase's MixConsole meters
        newValue = 1 + Math.log10(0.1 + 0.9 * (1 + Math.log10(0.1 + 0.9 * newValue)));

        lastMeterUpdateTime = now;
        channelPorts.output.sendMidi(context, [
          0xd0,
          (index % 8 << 4) + Math.ceil(newValue * 14 - 0.25),
        ]);
      }
    };

    // Buttons
    const buttons = channel.buttons;
    [buttons.record, buttons.solo, buttons.mute, buttons.select].forEach((button, row) => {
      bindLedButton(channelPorts, button, row * 8 + (index % 8), true);
    });

    // Fader
    bindFader(channelPorts, channel.fader, index % 8);
  });

  const mainPorts = ports.getMainPorts();

  bindFader(mainPorts, elements.control.mainFader, 8);

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
    bindLedButton(mainPorts, button, 40 + index);
  });

  // Display
  const displayLeds = elements.display.leds;
  [displayLeds.smpte, displayLeds.beats, displayLeds.solo].forEach((lamp, index) => {
    bindLamp(mainPorts, lamp, 0x71 + index);
  });

  const lastTimeFormat = new ContextStateVariable("");
  const isInitialized = new ContextStateVariable(false);
  elements.display.onTimeUpdated = (context, time, timeFormat) => {
    const hasTimeFormatChanged = timeFormat !== lastTimeFormat.get(context);
    if (hasTimeFormatChanged) {
      lastTimeFormat.set(context, timeFormat);
    }

    time = time.replaceAll(" ", "");
    const isTimeFormatSupported = /^(?:[\d]+[\.\:]){3}[\d]+$/.test(time);

    if (isTimeFormatSupported) {
      managers.segmentDisplay.setTimeString(context, time);
    }

    if (hasTimeFormatChanged) {
      if (!isTimeFormatSupported) {
        managers.segmentDisplay.clearTime(context);
      }
      // Adapt time mode LEDs to time format
      if (!isInitialized.get(context)) {
        // Using `setProcessValue` on initialization somehow crashes the host, so we don't do it on
        // initialization.
        isInitialized.set(context, true);
      } else {
        elements.display.leds.smpte.mSurfaceValue.setProcessValue(
          context,
          +/^(?:[\d]+[\:]){3}[\d]+$/.test(time)
        );
        elements.display.leds.beats.mSurfaceValue.setProcessValue(
          context,
          +/^(?:[\d]+[\.]){3}[\d]+$/.test(time)
        );
      }
    }
  };

  elements.display.setAssignment = (context, assignment) => {
    managers.segmentDisplay.setAssignment(context, assignment);
  };

  // Jog wheel
  const jogWheel = elements.control.jogWheel;
  const jogWheelValue = elements.control.jogWheel.mSurfaceValue;

  jogWheel.mProxyValue.mMidiBinding
    .setInputPort(mainPorts.input)
    .bindToControlChange(0, 0x3c)
    .setTypeRelativeSignedBit();
  jogWheel.mProxyValue.mOnProcessValueChange = (context, value, difference) => {
    const jumpOffset = 0.4;

    // Prevent value from reaching its limits
    if (value < 0.5 - jumpOffset) {
      jogWheel.mProxyValue.setProcessValue(context, value + jumpOffset);
    } else if (value > 0.5 + jumpOffset) {
      jogWheel.mProxyValue.setProcessValue(context, value - jumpOffset);
    }

    // Compensate for the difference value offsets introduced above
    if (Math.abs(difference) >= jumpOffset - 0.1) {
      if (difference > 0) {
        difference -= jumpOffset;
      } else {
        difference += jumpOffset;
      }
    }

    if (elements.control.jogWheel.mKnobModeEnabledValue.getProcessValue(context)) {
      jogWheelValue.setProcessValue(
        context,
        Math.max(0, Math.min(1, jogWheelValue.getProcessValue(context) + difference))
      );
    } else {
      // Handle jog events
      if (difference !== 0) {
        if (difference < 0) {
          jogWheel.mJogLeftValue.setProcessValue(context, 1);
        } else {
          jogWheel.mJogRightValue.setProcessValue(context, 1);
        }
      }
    }
  };
}
