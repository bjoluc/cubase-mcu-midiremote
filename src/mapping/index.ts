import { config } from "../config";
import { DecoratedFactoryMappingPage } from "../decorators/page";
import { Devices, MainDevice } from "../Devices";
import { GlobalBooleanVariables } from "../midi";
import { ActivationCallbacks } from "../midi/connection";
import { SegmentDisplayManager } from "../midi/managers/SegmentDisplayManager";
import { ContextStateVariable } from "../util";
import {
  bindControlButtons,
  bindDirectionButtons,
  bindFootControl,
  bindJogWheelSection,
  bindSegmentDisplaySection,
} from "./control";
import { bindEncoders } from "./encoders";

export function makeHostMapping(
  page: DecoratedFactoryMappingPage,
  devices: Devices,
  segmentDisplayManager: SegmentDisplayManager,
  globalBooleanVariables: GlobalBooleanVariables,
  activationCallbacks: ActivationCallbacks
) {
  // Mixer channels
  const mixerBankZone = page.mHostAccess.mMixConsole
    .makeMixerBankZone()
    .excludeInputChannels()
    .excludeOutputChannels()
    .setFollowVisibility(true); // TODO MixConsole Visibility Presets are not taken into account here

  const mixerBankChannels = devices
    .flatMap((device) => device.channelElements)
    .map((channelElements) => {
      const channel = mixerBankZone.makeMixerBankChannel();

      // Scribble strips
      page.makeValueBinding(channelElements.scribbleStrip.trackTitle, channel.mValue.mSelected);

      // VU Meter
      page.makeValueBinding(channelElements.vuMeter, channel.mValue.mVUMeter);

      // Buttons
      const buttons = channelElements.buttons;
      page
        .makeValueBinding(buttons.record.mSurfaceValue, channel.mValue.mRecordEnable)
        .setTypeToggle();
      page.makeValueBinding(buttons.solo.mSurfaceValue, channel.mValue.mSolo).setTypeToggle();
      page.makeValueBinding(buttons.mute.mSurfaceValue, channel.mValue.mMute).setTypeToggle();
      page.makeValueBinding(buttons.select.mSurfaceValue, channel.mValue.mSelected).setTypeToggle();

      // Fader
      page.makeValueBinding(channelElements.fader.mSurfaceValue, channel.mValue.mVolume);

      return channel;
    });

  bindEncoders(page, devices, mixerBankChannels, segmentDisplayManager, globalBooleanVariables);

  devices.forEach((device) => {
    if (device instanceof MainDevice) {
      const controlSectionElements = device.controlSectionElements;

      // 7-segment display
      bindSegmentDisplaySection(page, controlSectionElements);

      // Main fader
      page.makeValueBinding(
        controlSectionElements.mainFader.mSurfaceValue,
        config.mapMainFaderToControlRoom
          ? page.mHostAccess.mControlRoom.mMainChannel.mLevelValue
          : page.mHostAccess.mMixConsole
              .makeMixerBankZone()
              .includeOutputChannels()
              .makeMixerBankChannel().mValue.mVolume
      );

      // 1-8, F1-F8, Modify, Automation, Utility, Transport, Navigation
      bindControlButtons(page, controlSectionElements, device.channelElements, mixerBankZone);

      // Directions
      bindDirectionButtons(page, controlSectionElements);

      // Jog wheel
      bindJogWheelSection(page, controlSectionElements);

      // Foot Control
      bindFootControl(page, controlSectionElements);
    }
  });

  // The `mTransportLocator.mOnChange` callback is first invoked before the device driver is
  // activated. The workaround below defers the first time display update until the driver is
  // activated.
  const isDriverActivated = new ContextStateVariable(false);
  const initialTransportLocatorPosition = new ContextStateVariable({ time: "", timeFormat: "" });

  activationCallbacks.addCallback((context) => {
    isDriverActivated.set(context, true);

    const { time, timeFormat } = initialTransportLocatorPosition.get(context);
    segmentDisplayManager.updateTime(context, time, timeFormat);

    // TODO: This is a workaround forcing the Beats/SMPTE LEDs to be set. It is required since
    // calling `myHostValue.setProcessValue()` doesn't trigger `mOnProcessValueChange` when called
    // on device driver activation.
    devices.forEach((device) => {
      if (device instanceof MainDevice) {
        const output = device.ports.output;
        output.sendNoteOn(context, 0x71, +/^(?:[\d]+\:){3}[\d]+$/.test(time)); // SMPTE LED
        output.sendNoteOn(context, 0x72, +/^(?:[ \d]+\.){2} \d\.[\d ]+$/.test(time)); // Beats LED
      }
    });
  });

  // Time display – once for all devices; individual devices are handled by the
  // SegmentDisplayManager
  page.mHostAccess.mTransport.mTimeDisplay.mPrimary.mTransportLocator.mOnChange = (
    context,
    mapping,
    time,
    timeFormat
  ) => {
    if (!isDriverActivated.get(context)) {
      initialTransportLocatorPosition.set(context, { time, timeFormat });
    } else {
      segmentDisplayManager.updateTime(context, time, timeFormat);
    }
  };
}
