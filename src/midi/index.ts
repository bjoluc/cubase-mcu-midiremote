import { config } from "../config";
import { TouchSensitiveFader } from "../decorators/surface";
import { Device, MainDevice } from "../devices";
import {
  BooleanContextStateVariable,
  ContextStateVariable,
  TimerUtils,
  createElements,
} from "../util";
import { PortPair } from "./PortPair";
import { ActivationCallbacks } from "./connection";
import { RgbColor } from "./managers/ColorManager";
import { LcdManager } from "./managers/LcdManager";
import { sendChannelMeterMode, sendGlobalMeterModeOrientation, sendMeterLevel } from "./util";

export enum EncoderDisplayMode {
  SingleDot = 0,
  BoostOrCut = 1,
  Wrap = 2,
  Spread = 3,
}

/** Declares some global context-dependent variables that (may) affect multiple devices */
export const createGlobalBooleanVariables = () => ({
  areMotorsActive: new BooleanContextStateVariable(),
  isValueDisplayModeActive: new BooleanContextStateVariable(),
  areDisplayRowsFlipped: new BooleanContextStateVariable(),
  isEncoderAssignmentActive: createElements(6, () => new BooleanContextStateVariable()),
  isFlipModeActive: new BooleanContextStateVariable(),
  areChannelMetersEnabled: new BooleanContextStateVariable(),
  isGlobalLcdMeterModeVertical: new BooleanContextStateVariable(),
  shouldMeterOverloadsBeCleared: new BooleanContextStateVariable(true),
});

export type GlobalBooleanVariables = ReturnType<typeof createGlobalBooleanVariables>;

export function bindDeviceToMidi(
  device: Device,
  globalBooleanVariables: GlobalBooleanVariables,
  activationCallbacks: ActivationCallbacks,
  { setTimeout }: TimerUtils
) {
  const ports = device.ports;

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
        globalBooleanVariables.areMotorsActive.get(context) &&
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
        if (globalBooleanVariables.areMotorsActive.get(context)) {
          forceUpdate.set(context, false);
          sendValue(context, 0);
        }
      }
    };

    globalBooleanVariables.areMotorsActive.addOnChangeCallback((context, areMotorsActive) => {
      if (areMotorsActive) {
        sendValue(context, lastFaderValue.get(context));
      }
    });
  }

  for (const [channelIndex, channel] of device.channelElements.entries()) {
    // Push Encoder
    channel.encoder.mEncoderValue.mMidiBinding
      .setInputPort(ports.input)
      .bindToControlChange(0, 16 + channelIndex)
      .setTypeRelativeSignedBit();
    channel.encoder.mPushValue.mMidiBinding
      .setInputPort(ports.input)
      .bindToNote(0, 32 + channelIndex);
    channel.encoder.mEncoderValue.mOnProcessValueChange = (context, newValue) => {
      const displayMode = channel.encoder.mDisplayModeValue.getProcessValue(context);

      const isCenterLedOn = newValue === (displayMode === EncoderDisplayMode.Spread ? 0 : 0.5);
      const position =
        1 + Math.round(newValue * (displayMode === EncoderDisplayMode.Spread ? 5 : 10));

      ports.output.sendMidi(context, [
        0xb0,
        0x30 + channelIndex,
        (+isCenterLedOn << 6) + (displayMode << 4) + position,
      ]);
    };

    // Display colors – only supported by the X-Touch
    if (DEVICE_NAME === "X-Touch") {
      const encoderColor = new ContextStateVariable({ isAssigned: false, r: 0, g: 0, b: 0 });
      channel.encoder.mEncoderValue.mOnColorChange = (context, r, g, b, _a, isAssigned) => {
        encoderColor.set(context, { isAssigned, r, g, b });
        updateColor(context);
      };

      const channelColor = new ContextStateVariable({ isAssigned: false, r: 0, g: 0, b: 0 });
      channel.scribbleStrip.trackTitle.mOnColorChange = (context, r, g, b, _a, isAssigned) => {
        channelColor.set(context, { isAssigned, r, g, b });
        updateColor(context);
      };

      var updateColor = (context: MR_ActiveDevice) => {
        let color: RgbColor;
        const currentEncoderColor = encoderColor.get(context);
        const currentChannelColor = channelColor.get(context);

        if (config.displayColorMode === "encoders") {
          // Fall back to channel color if encoder is not assigned
          color = currentEncoderColor.isAssigned ? currentEncoderColor : currentChannelColor;
        } else if (config.displayColorMode === "channels") {
          color = currentChannelColor;

          // Use white if an encoder has a color but the channel has none. Otherwise, encoder titles
          // on unassigned channels would not be readable.
          if (!currentChannelColor.isAssigned && currentEncoderColor.isAssigned) {
            color = { r: 1, g: 1, b: 1 };
          }
        } else {
          color =
            currentChannelColor.isAssigned || currentEncoderColor.isAssigned
              ? { r: 1, g: 1, b: 1 }
              : { r: 0, g: 0, b: 0 };
        }

        device.colorManager?.setChannelColorRgb(context, channelIndex, color);
      };
    }

    // Scribble Strip
    const currentParameterName = new ContextStateVariable("");
    const currentDisplayValue = new ContextStateVariable("");
    const currentChannelName = new ContextStateVariable("");
    const isLocalValueModeActive = new ContextStateVariable(false);

    const updateNameValueDisplay = (context: MR_ActiveDevice) => {
      const row = +globalBooleanVariables.areDisplayRowsFlipped.get(context);

      // Skip updating the lower display row on MCU Pro when horizontal metering mode is enabled
      if (
        DEVICE_NAME === "MCU Pro" &&
        row === 1 &&
        globalBooleanVariables.areChannelMetersEnabled.get(context) &&
        !globalBooleanVariables.isGlobalLcdMeterModeVertical.get(context)
      ) {
        return;
      }

      device.lcdManager.setChannelText(
        context,
        row,
        channelIndex,
        isLocalValueModeActive.get(context) ||
          globalBooleanVariables.isValueDisplayModeActive.get(context)
          ? currentDisplayValue.get(context)
          : currentParameterName.get(context)
      );
    };

    channel.encoder.mEncoderValue.mOnDisplayValueChange = (context, value) => {
      value =
        {
          // French
          Éteint: "Eteint",

          // Japanese
          オン: "On",
          オフ: "Off",

          // Russian
          "Вкл.": "On",
          "Выкл.": "Off",

          // Chinese
          开: "On",
          关: "Off",
        }[value] ?? value;

      currentDisplayValue.set(
        context,
        LcdManager.centerString(
          LcdManager.abbreviateString(LcdManager.stripNonAsciiCharacters(value))
        )
      );
      isLocalValueModeActive.set(context, true);
      updateNameValueDisplay(context);
      setTimeout(
        context,
        `updateDisplay${device.firstChannelIndex + channelIndex}`,
        (context) => {
          isLocalValueModeActive.set(context, false);
          updateNameValueDisplay(context);
        },
        1
      );
    };

    channel.encoder.mEncoderValue.mOnTitleChange = (context, title1, title2) => {
      // Reset encoder LED ring when channel becomes unassigned
      if (title1 === "") {
        ports.output.sendMidi(context, [0xb0, 0x30 + channelIndex, 0]);
      }

      // Luckily, `mOnTitleChange` runs after `mOnDisplayValueChange`, so setting
      // `isLocalValueModeActive` to `false` here overwrites the `true` that `mOnDisplayValueChange`
      // sets
      isLocalValueModeActive.set(context, false);

      title2 =
        {
          // English
          "Pan Left-Right": "Pan",

          // German
          "Pan links/rechts": "Pan",

          // Spanish
          "Pan izquierda-derecha": "Pan",

          // French
          "Pan gauche-droit": "Pan",
          "Pré/Post": "PrePost",

          // Italian
          "Pan sinistra-destra": "Pan",
          Monitoraggio: "Monitor",

          // Japanese
          左右パン: "Pan",
          モニタリング: "Monitor",
          レベル: "Level",

          // Portuguese
          "Pan Esquerda-Direita": "Pan",
          Nível: "Nivel",
          "Pré/Pós": "PrePost",

          // Russian
          "Панорама Лево-Право": "Pan",
          Монитор: "Monitor",
          Уровень: "Level",
          "Пре/Пост": "PrePost",

          // Chinese
          "声像 左-右": "Pan",
          监听: "Monitor",
          电平: "Level",
          "前置/后置": "PrePost",
        }[title2] ?? title2;

      currentParameterName.set(
        context,
        LcdManager.centerString(
          LcdManager.abbreviateString(LcdManager.stripNonAsciiCharacters(title2))
        )
      );
      updateNameValueDisplay(context);
    };

    globalBooleanVariables.isValueDisplayModeActive.addOnChangeCallback(updateNameValueDisplay);
    globalBooleanVariables.areDisplayRowsFlipped.addOnChangeCallback(updateNameValueDisplay);

    const updateTrackTitleDisplay = (context: MR_ActiveDevice) => {
      const row = 1 - +globalBooleanVariables.areDisplayRowsFlipped.get(context);

      // Skip updating the lower display row on MCU Pro when horizontal metering mode is enabled
      if (
        DEVICE_NAME === "MCU Pro" &&
        row === 1 &&
        globalBooleanVariables.areChannelMetersEnabled.get(context) &&
        !globalBooleanVariables.isGlobalLcdMeterModeVertical.get(context)
      ) {
        return;
      }

      device.lcdManager.setChannelText(context, row, channelIndex, currentChannelName.get(context));
    };
    channel.scribbleStrip.trackTitle.mOnTitleChange = (context, title) => {
      currentChannelName.set(
        context,
        LcdManager.abbreviateString(LcdManager.stripNonAsciiCharacters(title))
      );
      updateTrackTitleDisplay(context);

      if (DEVICE_NAME === "MCU Pro") {
        clearOverload(context);
      }
    };
    globalBooleanVariables.areDisplayRowsFlipped.addOnChangeCallback(updateTrackTitleDisplay);

    if (DEVICE_NAME === "MCU Pro") {
      // Handle metering mode changes (per channel)
      globalBooleanVariables.isGlobalLcdMeterModeVertical.addOnChangeCallback(
        (context, isMeterModeVertical) => {
          // Update the upper display row before leaving vertical metering mode
          if (!isMeterModeVertical) {
            (globalBooleanVariables.areDisplayRowsFlipped.get(context)
              ? updateTrackTitleDisplay
              : updateNameValueDisplay)(context);
          }
        }
      );

      globalBooleanVariables.areChannelMetersEnabled.addOnChangeCallback(
        (context, areMetersEnabled) => {
          sendChannelMeterMode(context, ports.output, channelIndex, areMetersEnabled);

          // Update the lower display row after disabling channel meters
          if (!areMetersEnabled) {
            (globalBooleanVariables.areDisplayRowsFlipped.get(context)
              ? updateNameValueDisplay
              : updateTrackTitleDisplay)(context);
          }
        }
      );
    }

    // VU Meter
    let lastMeterUpdateTime = 0;
    channel.vuMeter.mOnProcessValueChange = (context, newValue) => {
      const now: number = performance.now(); // ms

      if (now - lastMeterUpdateTime > 125) {
        lastMeterUpdateTime = now;

        // Apply a log scale twice to make the meters look more like Cubase's MixConsole meters
        const meterLevel = Math.ceil(
          (1 + Math.log10(0.1 + 0.9 * (1 + Math.log10(0.1 + 0.9 * newValue)))) * 0xe - 0.25
        );

        sendMeterLevel(context, ports.output, channelIndex, meterLevel);
      }
    };
    /** Clears the channel meter's overload indicator */
    const clearOverload = (context: MR_ActiveDevice) => {
      sendMeterLevel(context, ports.output, channelIndex, 0xf);
    };
    globalBooleanVariables.shouldMeterOverloadsBeCleared.addOnChangeCallback(
      (context, shouldOverloadsBeCleared) => {
        if (shouldOverloadsBeCleared) {
          clearOverload(context);
        }
      }
    );

    // Channel Buttons
    const buttons = channel.buttons;
    for (const [row, button] of [
      buttons.record,
      buttons.solo,
      buttons.mute,
      buttons.select,
    ].entries()) {
      button.bindToNote(ports, row * 8 + channelIndex, true);
    }

    // Fader
    bindFader(ports, channel.fader, channelIndex);
  }

  if (DEVICE_NAME === "MCU Pro") {
    // Handle metering mode changes (globally)
    globalBooleanVariables.isGlobalLcdMeterModeVertical.addOnChangeCallback(
      (context, isMeterModeVertical) => {
        sendGlobalMeterModeOrientation(context, ports.output, isMeterModeVertical);
      }
    );
  }

  if (DEVICE_NAME === "X-Touch") {
    // Send an initial (all-black by default) color message to the device. Otherwise, in projects
    // without enough channels for each device, devices without channels assigned to them would not
    // receive a color update at all, leaving their displays white although they should be black.
    activationCallbacks.addCallback((context) => {
      device.colorManager?.sendColors(context);
    });
  }

  // Control Section (main devices only)
  if (device instanceof MainDevice) {
    const elements = device.controlSectionElements;
    const buttons = elements.buttons;

    activationCallbacks.addCallback((context) => {
      // Workaround for https://forums.steinberg.net/t/831123:
      ports.output.sendNoteOn(context, 0x4f, 1);

      // Workaround for encoder assign buttons not being enabled on activation
      // (https://forums.steinberg.net/t/831123):
      ports.output.sendNoteOn(context, 0x2a, 1);
      for (const note of [0x28, 0x29, 0x2b, 0x2c, 0x2d]) {
        ports.output.sendNoteOn(context, note, 0);
      }
    });

    bindFader(ports, elements.mainFader, 8);

    globalBooleanVariables.isFlipModeActive.addOnChangeCallback((context, value) => {
      buttons.flip.mLedValue.setProcessValue(context, +value);
    });

    for (const [
      buttonIndex,
      isActive,
    ] of globalBooleanVariables.isEncoderAssignmentActive.entries()) {
      isActive.addOnChangeCallback((context, value) => {
        buttons.encoderAssign[buttonIndex].mLedValue.setProcessValue(context, +value);
      });
    }

    for (const [index, button] of [
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
    ].entries()) {
      button.bindToNote(ports, 40 + index);
    }

    // Segment Display - handled by the SegmentDisplayManager, except for:
    const { smpte, beats, solo } = elements.displayLeds;
    [smpte, beats, solo].forEach((lamp, index) => {
      lamp.bindToNote(ports.output, 0x71 + index);
    });

    // Jog wheel
    elements.jogWheel.bindToControlChange(ports.input, 0x3c);

    // Foot control
    for (const [index, footSwitch] of elements.footSwitches.entries()) {
      footSwitch.mSurfaceValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, 0x66 + index);
    }
    elements.expressionPedal.mSurfaceValue.mMidiBinding
      .setInputPort(ports.input)
      .bindToControlChange(0, 0x2e)
      .setTypeAbsolute();
  }
}
