import { RgbColor } from "./managers/colors/ColorManager";
import { SegmentDisplayManager } from "./managers/SegmentDisplayManager";
import { sendChannelMeterMode, sendGlobalMeterModeOrientation, sendMeterLevel } from "./util";
import { config, deviceConfig } from "/config";
import { MidiOutputPort } from "/decorators/MidiOutputPort";
import { Device, MainDevice } from "/devices";
import { GlobalState } from "/state";
import { ContextVariable, LifecycleCallbacks } from "/util";

export function bindDevicesToMidi(
  devices: Device[],
  globalState: GlobalState,
  lifecycleCallbacks: LifecycleCallbacks,
) {
  const segmentDisplayManager = new SegmentDisplayManager(devices);

  lifecycleCallbacks.addDeactivationCallback((context) => {
    segmentDisplayManager.clearAssignment(context);
    segmentDisplayManager.clearTime(context);
  });

  for (const device of devices) {
    bindLifecycleEvents(device, lifecycleCallbacks);
    bindChannelElements(device, globalState);

    if (device instanceof MainDevice) {
      bindControlSectionElements(device, globalState);
    }
  }

  return { segmentDisplayManager };
}

function bindLifecycleEvents(device: Device, lifecycleCallbacks: LifecycleCallbacks) {
  const output = device.ports.output;

  const resetLeds = (context: MR_ActiveDevice) => {
    for (let note = 0; note < 0x76; note++) {
      output.sendNoteOn(context, note, 0);
    }
  };

  lifecycleCallbacks.addActivationCallback((context) => {
    resetLeds(context);

    // Send an initial (all-black by default) color message to the device. Otherwise, in projects
    // without enough channels for each device, devices without channels assigned to them would
    // not receive a color update at all, leaving their displays white although they should be
    // black.
    device.colorManager?.sendColors(context);
  });

  lifecycleCallbacks.addDeactivationCallback((context) => {
    device.colorManager?.resetColors(context);
    device.lcdManager.clearDisplays(context);

    // Reset faders
    for (let faderIndex = 0; faderIndex < 9; faderIndex++) {
      output.sendMidi(context, [0xe0 + faderIndex, 0, 0]);
    }

    resetLeds(context);

    // Reset encoder LED rings
    for (let encoderIndex = 0; encoderIndex < 8; encoderIndex++) {
      output.sendMidi(context, [0xb0, 0x30 + encoderIndex, 0]);
    }
  });
}

function bindVuMeter(
  vuMeter: MR_SurfaceCustomValueVariable,
  outputPort: MidiOutputPort,
  meterId: number,
  midiChannel = 0,
) {
  let lastMeterUpdateTime = 0;
  vuMeter.mOnProcessValueChange = (context, newValue) => {
    const now: number = performance.now(); // ms

    if (now - lastMeterUpdateTime > 125) {
      lastMeterUpdateTime = now;

      // Apply a log scale twice to make the meters look more like Cubase's MixConsole meters
      const meterLevel = Math.ceil(
        (1 + Math.log10(0.1 + 0.9 * (1 + Math.log10(0.1 + 0.9 * newValue)))) *
          (deviceConfig.maximumMeterValue ?? 0xe) -
          0.25,
      );

      sendMeterLevel(context, outputPort, meterId, meterLevel, midiChannel);
    }
  };
}

function bindChannelElements(device: Device, globalState: GlobalState) {
  const ports = device.ports;

  for (const [channelIndex, channel] of device.channelElements.entries()) {
    // Push Encoder
    channel.encoder.bindToMidi(ports, channelIndex);

    // Display colors
    if (deviceConfig.colorManager) {
      const encoderColor = new ContextVariable({ isAssigned: false, r: 0, g: 0, b: 0 });
      channel.encoder.mEncoderValue.mOnColorChange = (context, r, g, b, _a, isAssigned) => {
        encoderColor.set(context, { isAssigned, r, g, b });
        updateColor(context);
      };

      const channelColor = new ContextVariable({ isAssigned: false, r: 0, g: 0, b: 0 });
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
    const channelTextManager = device.lcdManager.channelTextManagers[channelIndex];

    channel.encoder.mOnEncoderValueTitleChange.addCallback((context, _title1, title2) => {
      channelTextManager.setParameterName(context, title2);
    });

    channel.encoder.mEncoderValue.mOnDisplayValueChange = (context, value) => {
      channelTextManager.setParameterValue(context, value);
    };

    channel.scribbleStrip.trackTitle.mOnTitleChange = (context, title) => {
      channelTextManager.setChannelName(context, title);

      if (DEVICE_NAME === "MCU Pro") {
        clearOverload(context);
      }
    };

    if (deviceConfig.hasSecondaryScribbleStrips && channel.scribbleStrip.meterPeakLevel) {
      channel.scribbleStrip.meterPeakLevel.mOnDisplayValueChange = (context, value) => {
        channelTextManager.setMeterPeakLevel(context, value);
      };

      channel.fader.mSurfaceValue.mOnDisplayValueChange = (context, value) => {
        channelTextManager.setFaderParameterValue(context, value);
      };

      channel.fader.mSurfaceValue.mOnTitleChange = (context, _title, parameterName) => {
        channelTextManager.setFaderParameterName(context, parameterName);
      };

      channel.fader.onTouchedValueChangeCallbacks.addCallback((context, isFaderTouched) => {
        channelTextManager.setIsFaderTouched(context, Boolean(isFaderTouched));
      });
    }

    /** Clears the channel meter's overload indicator */
    const clearOverload = (context: MR_ActiveDevice) => {
      sendMeterLevel(context, ports.output, channelIndex, 0xf);
    };

    // VU Meter
    bindVuMeter(channel.vuMeter, ports.output, channelIndex);

    globalState.areChannelMetersEnabled.addOnChangeCallback(
      (context, areMetersEnabled) => {
        sendChannelMeterMode(context, ports.output, channelIndex, areMetersEnabled);
      },
      0, // priority = 0: Disable channel meters *before* updating the lower display row
    );

    globalState.shouldMeterOverloadsBeCleared.addOnChangeCallback(
      (context, shouldOverloadsBeCleared) => {
        if (shouldOverloadsBeCleared) {
          clearOverload(context);
        }
      },
    );

    // Channel Buttons
    const buttons = channel.buttons;
    for (const [row, button] of [
      buttons.record,
      buttons.solo,
      buttons.mute,
      buttons.select,
    ].entries()) {
      button.bindToNote(ports, row * 8 + channelIndex);
    }

    // Fader
    channel.fader.bindToMidi(ports, channelIndex, globalState);
  }

  // Handle metering mode changes (globally)
  globalState.isGlobalLcdMeterModeVertical.addOnChangeCallback((context, isMeterModeVertical) => {
    sendGlobalMeterModeOrientation(context, ports.output, isMeterModeVertical);
  });
}

function bindControlSectionElements(device: MainDevice, globalState: GlobalState) {
  const ports = device.ports;

  const elements = device.controlSectionElements;
  const buttons = elements.buttons;

  elements.mainFader.bindToMidi(ports, 8, globalState);

  for (const [index, button] of [
    buttons.encoderAssign.track,
    buttons.encoderAssign.send,
    buttons.encoderAssign.pan,
    buttons.encoderAssign.plugin,
    buttons.encoderAssign.eq,
    buttons.encoderAssign.instrument,

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

    buttons.modify.undo,
    buttons.modify.redo,
    buttons.modify.save,
    buttons.modify.revert,

    buttons.automation.read,
    buttons.automation.write,
    buttons.automation.sends,
    buttons.automation.project,
    buttons.automation.mixer,
    buttons.automation.motor,

    buttons.utility.instrument,
    buttons.utility.main,
    buttons.utility.soloDefeat,
    buttons.utility.shift,

    buttons.transport.left,
    buttons.transport.right,
    buttons.transport.cycle,
    buttons.transport.punch,

    buttons.transport.markers.previous,
    buttons.transport.markers.add,
    buttons.transport.markers.next,

    buttons.transport.rewind,
    buttons.transport.forward,
    buttons.transport.stop,
    buttons.transport.play,
    buttons.transport.record,

    buttons.navigation.directions.up,
    buttons.navigation.directions.down,
    buttons.navigation.directions.left,
    buttons.navigation.directions.right,
    buttons.navigation.directions.center,

    buttons.scrub,
  ].entries()) {
    button.bindToNote(ports, 40 + index);
  }

  // Segment Display - handled by the SegmentDisplayManager, except for the individual LEDs:
  const { smpte, beats, solo } = elements.displayLeds;
  [smpte, beats, solo].forEach((lamp, index) => {
    lamp.bindToNote(ports.output, 0x71 + index);
  });

  // Jog wheel
  elements.jogWheel.bindToControlChange(ports.input, 0x3c);

  // Foot control
  elements.footSwitch1.mSurfaceValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, 0x66);
  elements.footSwitch2.mSurfaceValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, 0x67);
  elements.expressionPedal.mSurfaceValue.mMidiBinding
    .setInputPort(ports.input)
    .bindToControlChange(0, 0x2e)
    .setTypeAbsolute();

  // Main VU Meters
  if (elements.mainVuMeters) {
    bindVuMeter(elements.mainVuMeters.left, ports.output, 0, 1);
    bindVuMeter(elements.mainVuMeters.right, ports.output, 1, 1);
  }
}
