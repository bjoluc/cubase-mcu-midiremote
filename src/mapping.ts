import { EncoderDisplayMode } from "./midi";
import { SurfaceElements } from "./surface";
import { makeCallbackCollection } from "./util";

export function createHostMapping(mapping: MR_FactoryMapping, elements: SurfaceElements) {
  const page = mapping.makePage("Default");
  const host = page.mHostAccess;

  host.mTransport.mTimeDisplay.mPrimary.mTransportLocator.mOnChange = (
    context,
    mapping,
    newTime,
    oldTime
  ) => {
    elements.display.onTimeUpdated(context, newTime, oldTime);
  };

  const onActivate = makeCallbackCollection(page, "mOnActivate");

  const mixerBankZone = page.mHostAccess.mMixConsole.makeMixerBankZone("Current Bank");

  elements.channels.map((channelElements, index) => {
    const channel = mixerBankZone.makeMixerBankChannel();

    // Push Encoder
    onActivate.addCallback((context) => {
      channelElements.encoderDisplayMode.setProcessValue(context, EncoderDisplayMode.BoostOrCut);
    });
    page.makeValueBinding(channelElements.encoder.mEncoderValue, channel.mValue.mPan);

    // Scribble Strip
    page.makeValueBinding(channelElements.scribbleStrip.row2, channel.mValue.mVolume);

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
    page.makeValueBinding(channelElements.faderTouched, channel.mValue.mSelected).setTypeToggle();
  });
}
