import { Devices, MainDevice } from "../Devices";
import { GlobalBooleanVariables } from "../midi";
import { SegmentDisplayManager } from "../midi/managers/SegmentDisplayManager";
import { config } from "../config";
import { DecoratedFactoryMappingPage } from "../decorators/page";

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
  globalBooleanVariables: GlobalBooleanVariables
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

  // Time display – once for all devices; individual devices are handled by the
  // SegmentDisplayManager
  page.mHostAccess.mTransport.mTimeDisplay.mPrimary.mTransportLocator.mOnChange = (
    context,
    mapping,
    time,
    timeFormat
  ) => {
    segmentDisplayManager.updateTime(context, time, timeFormat);
  };
}
