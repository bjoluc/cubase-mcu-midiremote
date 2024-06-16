import { bindControlSection, bindMouseValueControl } from "./control";
import { bindEncoders } from "./encoders";
import { config } from "/config";
import { Device, MainDevice } from "/devices";
import { SegmentDisplayManager } from "/midi/managers/SegmentDisplayManager";
import { GlobalState } from "/state";
import { ContextVariable, LifecycleCallbacks } from "/util";

export function makeHostMapping(
  page: MR_FactoryMappingPage,
  devices: Device[],
  segmentDisplayManager: SegmentDisplayManager,
  globalState: GlobalState,
  lifecycleCallbacks: LifecycleCallbacks,
) {
  // Mixer channels
  const mixerBankZone = page.mHostAccess.mMixConsole.makeMixerBankZone();
  for (const [configName, methodNamePart] of Object.entries(<const>{
    audio: "Audio",
    instrument: "Instrument",
    sampler: "Sampler",
    midi: "MIDI",
    fx: "FX",
    group: "Group",
    vca: "VCA",
    input: "Input",
    output: "Output",
  })) {
    if (config.channelVisibility[configName]) {
      mixerBankZone[`include${methodNamePart}Channels`]();
    }
  }

  mixerBankZone.setFollowVisibility(true);

  const mixerBankChannels = devices
    .flatMap((device) => device.channelElements)
    .map((channelElements) => {
      const channel = mixerBankZone.makeMixerBankChannel();

      // Scribble strips
      page.makeValueBinding(channelElements.scribbleStrip.trackTitle, channel.mValue.mVolume);

      // VU Meter
      page.makeValueBinding(channelElements.vuMeter, channel.mValue.mVUMeter);

      // This is a crazy workaround for https://forums.steinberg.net/t/842187: Running the below
      // block twice keeps `mOnTitleChange` and `mOnColorChange` working on Cubase >= 12.0.60 for
      // surface variables bound to the involved host variables.
      for (let i = 0; i < 2; i++) {
        // Buttons
        const buttons = channelElements.buttons;
        page
          .makeValueBinding(buttons.record.mSurfaceValue, channel.mValue.mRecordEnable)
          .setTypeToggle();
        page.makeValueBinding(buttons.solo.mSurfaceValue, channel.mValue.mSolo).setTypeToggle();
        page.makeValueBinding(buttons.mute.mSurfaceValue, channel.mValue.mMute).setTypeToggle();
        page
          .makeValueBinding(buttons.select.mSurfaceValue, channel.mValue.mSelected)
          .setTypeToggle();

        // Fader
        page.makeValueBinding(channelElements.fader.mSurfaceValue, channel.mValue.mVolume);
      }

      return channel;
    });

  for (const device of devices) {
    if (device instanceof MainDevice) {
      const controlSectionElements = device.controlSectionElements;

      // Main fader
      page.makeValueBinding(
        controlSectionElements.mainFader.mSurfaceValue,
        config.mapMainFaderToControlRoom
          ? page.mHostAccess.mControlRoom.mMainChannel.mLevelValue
          : page.mHostAccess.mMixConsole
              .makeMixerBankZone()
              .includeOutputChannels()
              .makeMixerBankChannel().mValue.mVolume,
      );

      // Display buttons, 1-8, Modify, Automation, Utility, Transport, Navigation, Jog wheel
      bindControlSection(page, device, mixerBankZone, globalState);
    }
  }

  bindEncoders(page, devices, mixerBankChannels, segmentDisplayManager, globalState);

  // Sends button (control value under cursor) – this has to be bound after encoders, as it binds an
  // encoder itself which would be masked by later encoder bindings otherwise.
  for (const device of devices) {
    if (device instanceof MainDevice) {
      bindMouseValueControl(page, device);
    }
  }

  lifecycleCallbacks.addActivationCallback((context) => {
    globalState.areMotorsActive.set(context, true);
  });

  // The `mTransportLocator.mOnChange` callback is first invoked before the device driver is
  // activated. The workaround below defers the first time display update to when the driver has
  // been activated.
  const isDriverActivated = new ContextVariable(false);
  const initialTransportLocatorPosition = new ContextVariable({ time: "", timeFormat: "" });

  lifecycleCallbacks.addActivationCallback((context) => {
    isDriverActivated.set(context, true);

    const { time, timeFormat } = initialTransportLocatorPosition.get(context);
    segmentDisplayManager.updateTime(context, time, timeFormat);

    // This is a workaround forcing the Beats/SMPTE LEDs to be set. It is required since
    // calling `myHostValue.setProcessValue()` doesn't trigger `mOnProcessValueChange` when called
    // on device driver activation.
    for (const device of devices) {
      if (device instanceof MainDevice) {
        const output = device.ports.output;
        output.sendNoteOn(context, 0x71, +/^(?:[\d]+\:){3}[\d]+$/.test(time)); // SMPTE LED
        output.sendNoteOn(context, 0x72, +/^(?:[ \d]+\.){2} \d\.[\d ]+$/.test(time)); // Beats LED
      }
    }
  });

  // Time display – once for all devices; individual devices are handled by the
  // SegmentDisplayManager
  page.mHostAccess.mTransport.mTimeDisplay.mPrimary.mTransportLocator.mOnChange = (
    context,
    mapping,
    time,
    timeFormat,
  ) => {
    if (!isDriverActivated.get(context)) {
      initialTransportLocatorPosition.set(context, { time, timeFormat });
    } else {
      segmentDisplayManager.updateTime(context, time, timeFormat);
    }
  };

  // Selected track name global state variable
  page.mHostAccess.mTrackSelection.mMixerChannel.mOnTitleChange = (
    context,
    _mapping,
    trackName,
  ) => {
    if (trackName !== globalState.selectedTrackName.get(context)) {
      globalState.selectedTrackName.set(context, trackName);
    }
  };
}
