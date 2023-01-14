import { EncoderDisplayMode } from "./midi";
import { SurfaceElements } from "./surface";
import { makeCallbackCollection } from "./util";

export function createHostMapping(mapping: MR_FactoryMapping, elements: SurfaceElements) {
  const trackPage = mapping.makePage("Default");
  const onActivate = makeCallbackCollection(trackPage, "mOnActivate");

  const mixerBankZone = trackPage.mHostAccess.mMixConsole.makeMixerBankZone("Current Bank");

  elements.channels.map((channelElements, index) => {
    const channel = mixerBankZone.makeMixerBankChannel();

    // Push encoder
    trackPage.makeValueBinding(channelElements.encoder.mEncoderValue, channel.mValue.mPan);
    onActivate.addCallback((context) => {
      channelElements.encoderDisplayMode.setProcessValue(context, EncoderDisplayMode.BoostOrCut);
    });

    // Scribble strip
    trackPage.makeValueBinding(channelElements.scribbleStrip.row2, channel.mValue.mVolume);

    // Buttons
    const buttons = channelElements.buttons;
    trackPage
      .makeValueBinding(buttons.record.mSurfaceValue, channel.mValue.mRecordEnable)
      .setTypeToggle();
    trackPage.makeValueBinding(buttons.solo.mSurfaceValue, channel.mValue.mSolo).setTypeToggle();
    trackPage.makeValueBinding(buttons.mute.mSurfaceValue, channel.mValue.mMute).setTypeToggle();
    trackPage
      .makeValueBinding(buttons.select.mSurfaceValue, channel.mValue.mSelected)
      .setTypeToggle();

    // Fader
    trackPage.makeValueBinding(channelElements.fader.mSurfaceValue, channel.mValue.mVolume);
    trackPage
      .makeValueBinding(channelElements.faderTouched, channel.mValue.mSelected)
      .setTypeToggle();
  });
}
