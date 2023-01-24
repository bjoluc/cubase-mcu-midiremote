import { SurfaceElements } from "../surface";
import {
  bindDirectionButtons,
  bindJogWheelSection,
  bindNavigationButtons,
  bindSegmentDisplaySection,
  bindTransportButtons,
} from "./control";
import { bindEncoders } from "./encoders";

export function createHostMapping(
  mapping: MR_FactoryMapping,
  elements: SurfaceElements,
  hostDefaults: MR_HostDefaults
) {
  const page = mapping.makePage("Mixer");

  // 7-segment display
  bindSegmentDisplaySection(page, elements);

  const mixerBankZone = page.mHostAccess.mMixConsole
    .makeMixerBankZone()
    .excludeInputChannels()
    .excludeOutputChannels();

  const mixerBankChannels = elements.channels.map((channelElements) => {
    const channel = mixerBankZone.makeMixerBankChannel();

    // Scribble strips
    page.makeValueBinding(channelElements.scribbleStrip.trackTitle, channel.mValue.mVolume);

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

  bindEncoders(page, elements, mixerBankChannels, hostDefaults);

  // Transport section
  bindTransportButtons(page, elements);

  // Navigation section
  bindNavigationButtons(page, elements, mixerBankZone);
  bindDirectionButtons(page, elements);

  // Jog wheel
  bindJogWheelSection(page, elements);
}
