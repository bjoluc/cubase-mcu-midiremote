import { LedButton, SurfaceElements } from "src/surface";
import { makeCallbackCollection } from "src/util";
import { MidiManagers } from "./managers";
import { LcdManager } from "./managers/LcdManager";
import { MidiPorts, PortPair } from "./MidiPorts";

export enum EncoderDisplayMode {
  SingleDot = 0,
  BoostOrCut = 1,
  Wrap = 2,
  Spread = 3,
}

export enum ParameterName {
  /** Display the title of the parameter that the encoder controls */
  Auto,

  /** Display no name at all */
  Empty,

  Monitor,
  Gain,
  Phase,
  Pan,
  Eq1Freq,
  Eq1Gain,
  Eq1Q,
  Eq1Type,
  Eq2Freq,
  Eq2Gain,
  Eq2Q,
  Eq2Type,
  Eq3Freq,
  Eq3Gain,
  Eq3Q,
  Eq3Type,
  Eq4Freq,
  Eq4Gain,
  Eq4Q,
  Eq4Type,
  SendLevel,
  Pre,
}

const parameterNameStrings: Record<number, string | undefined> = {
  [ParameterName.Auto]: undefined,
  [ParameterName.Empty]: "",
  [ParameterName.Monitor]: "Monitor",
  [ParameterName.Gain]: "Gain",
  [ParameterName.Phase]: "Phase",
  [ParameterName.Pan]: "Pan",
  [ParameterName.Eq1Freq]: "EQ1Freq",
  [ParameterName.Eq1Gain]: "EQ1Gain",
  [ParameterName.Eq1Q]: "EQ1 Q",
  [ParameterName.Eq1Type]: "EQ1Type",
  [ParameterName.Eq2Freq]: "EQ2Freq",
  [ParameterName.Eq2Gain]: "EQ2Gain",
  [ParameterName.Eq2Q]: "EQ2 Q",
  [ParameterName.Eq2Type]: "EQ2Type",
  [ParameterName.Eq3Freq]: "EQ3Freq",
  [ParameterName.Eq3Gain]: "EQ3Gain",
  [ParameterName.Eq3Q]: "EQ3 Q",
  [ParameterName.Eq3Type]: "EQ3Type",
  [ParameterName.Eq4Freq]: "EQ4Freq",
  [ParameterName.Eq4Gain]: "EQ4Gain",
  [ParameterName.Eq4Q]: "EQ4 Q",
  [ParameterName.Eq4Type]: "EQ4Type",
  [ParameterName.SendLevel]: "SendLvl",
  [ParameterName.Pre]: "Pre",
};

export function bindSurfaceElementsToMidi(
  elements: SurfaceElements,
  ports: MidiPorts,
  managers: MidiManagers
) {
  function bindLedButton(ports: PortPair, button: LedButton, note: number) {
    let currentSurfaceValue = 0;
    button.mSurfaceValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, note);
    button.mSurfaceValue.mOnProcessValueChange = (context, newValue) => {
      currentSurfaceValue = newValue;
      ports.output.sendNoteOn(context, note, newValue);
    };

    let currentLedValue = 0;
    button.mLedValue.mOnProcessValueChange = (context, newValue) => {
      currentLedValue = newValue;
      ports.output.sendNoteOn(context, note, newValue);
    };

    button.mProxyValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, note);
    button.mProxyValue.mOnProcessValueChange = (context, newValue) => {
      ports.output.sendNoteOn(context, note, newValue || currentSurfaceValue || currentLedValue);
    };
  }

  function bindLamp(ports: PortPair, lamp: MR_Lamp, note: number) {
    lamp.mSurfaceValue.mOnProcessValueChange = (context, newValue, difference) => {
      ports.output.sendNoteOn(context, note, newValue);
    };
  }

  function bindFader(ports: PortPair, fader: MR_Fader, faderIndex: number) {
    fader.mSurfaceValue.mMidiBinding.setInputPort(ports.input).bindToPitchBend(faderIndex);

    const sendValue = (context: MR_ActiveDevice, value: number) => {
      value *= 0x3fff;
      ports.output.sendMidi(context, [0xe0 + faderIndex, value & 0x7f, value >> 7]);
    };

    let forceUpdate = true;
    fader.mSurfaceValue.mOnProcessValueChange = (context, newValue, difference) => {
      // Dedupe identical messages to reduce fader noise
      if (difference !== 0 || forceUpdate) {
        forceUpdate = false;
        sendValue(context, newValue);
      }
    };

    // Set fader to `0` when unused
    fader.mSurfaceValue.mOnTitleChange = (context, title, unit) => {
      if (unit === "") {
        forceUpdate = true;
        fader.mSurfaceValue.setProcessValue(context, 0);
        sendValue(context, 0); // It somehow wouldn't happen otherwise
      }
    };
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
      const displayMode = channel.encoderDisplayMode.getProcessValue(context);

      const isCenterLedOn = newValue === (displayMode === EncoderDisplayMode.Spread ? 0 : 0.5);
      const position =
        1 + Math.round(newValue * (displayMode === EncoderDisplayMode.Spread ? 5 : 10));

      channelPorts.output.sendMidi(context, [
        0xb0,
        0x30 + (index % 8),
        (+isCenterLedOn << 6) + (displayMode << 4) + position,
      ]);
    };

    channel.encoder.mEncoderValue.mOnColorChange = (context, r, g, b, _a, isColorAssigned) => {
      managers.color.setChannelColorRgb(context, index, r, g, b);
    };

    // Scribble Strip
    let parameterName: string | undefined = "";
    let parameterTitle = "";
    let displayValue = "";

    const updateDisplay = (context: MR_ActiveDevice, isValueModeActive: number) => {
      managers.lcd.setChannelText(
        context,
        0,
        index,
        isValueModeActive ? displayValue : parameterName ?? parameterTitle
      );
    };
    channel.scribbleStrip.encoderParameterName.mOnProcessValueChange = (context, value) => {
      parameterName = parameterNameStrings[value];
      updateDisplay(context, elements.display.isValueModeActive.getProcessValue(context));
    };
    channel.encoder.mEncoderValue.mOnDisplayValueChange = (context, value) => {
      displayValue = LcdManager.centerString(LcdManager.abbreviateString(value));
      updateDisplay(context, elements.display.isValueModeActive.getProcessValue(context));
    };
    channel.encoder.mEncoderValue.mOnTitleChange = (context, value) => {
      parameterTitle = LcdManager.abbreviateString(value);
      updateDisplay(context, elements.display.isValueModeActive.getProcessValue(context));
    };

    onNameValueDisplayModeChange.addCallback(updateDisplay);

    channel.scribbleStrip.trackTitle.mOnTitleChange = (context, title) => {
      managers.lcd.setChannelText(context, 1, index, LcdManager.abbreviateString(title));
    };

    // VU Meter
    let lastMeterUpdateTime = 0;
    channel.vuMeter.mOnProcessValueChange = (context, newValue) => {
      // @ts-ignore `performance` exists in the runtime environment
      const now: number = performance.now(); // ms

      if (now - lastMeterUpdateTime > 125) {
        lastMeterUpdateTime = now;
        channelPorts.output.sendMidi(context, [0xd0, (index % 8 << 4) + Math.round(newValue * 14)]);
      }
    };

    // Buttons
    const buttons = channel.buttons;
    [buttons.record, buttons.solo, buttons.mute, buttons.select].forEach((button, row) => {
      bindLedButton(channelPorts, button, row * 8 + (index % 8));
    });

    // Fader
    bindFader(channelPorts, channel.fader, index % 8);
    channel.faderTouched.mMidiBinding
      .setInputPort(channelPorts.input)
      .bindToNote(0, 104 + (index % 8));
  });

  const mainPorts = ports.getMainPorts();

  bindFader(mainPorts, elements.control.mainFader, 8);
  elements.control.mainFaderTouched.mMidiBinding
    .setInputPort(mainPorts.input)
    .bindToNote(0, 104 + 8);

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
    bindLedButton(mainPorts, button, 40 + index);
  });

  // Display
  const displayLeds = elements.display.leds;
  [displayLeds.smpte, displayLeds.beats, displayLeds.solo].forEach((lamp, index) => {
    bindLamp(mainPorts, lamp, 0x71 + index);
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

  elements.display.setAssignment = (context, assignment) => {
    managers.segmentDisplay.setAssignment(context, assignment);
  };

  // Jog wheel
  const jogWheelValue = elements.control.jogWheel.mSurfaceValue;
  jogWheelValue.mMidiBinding
    .setInputPort(mainPorts.input)
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
