import { ActivationCallbacks } from "../midi/connection";
import { SurfaceElements } from "../surface";
import {
  bindControlButtons,
  bindDirectionButtons,
  bindJogWheelSection,
  bindSegmentDisplaySection,
} from "./control";
import { bindEncoders } from "./encoders";

export function createHostMapping(
  mapping: MR_FactoryMapping,
  elements: SurfaceElements,
  hostDefaults: MR_HostDefaults,
  activationCallbacks: ActivationCallbacks
) {
  const page = mapping.makePage("Mixer");

  // 7-segment display
  bindSegmentDisplaySection(page, elements);

  const mixerBankZone = page.mHostAccess.mMixConsole
    .makeMixerBankZone()
    .excludeInputChannels()
    .excludeOutputChannels()
    .setFollowVisibility(true); // TODO MixConsole Visibility Presets are not taken into account here

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

  // 1-8, F1-F8, Modify, Automation, Utility, Transport, Navigation
  bindControlButtons(page, elements, mixerBankZone);

  // Directions
  bindDirectionButtons(page, elements);

  // Jog wheel
  bindJogWheelSection(page, elements);
}
