import midiremoteApi from "midiremote_api_v1";

import { bindSurfaceElementsToMidi, EncoderDisplayMode } from "./midi";
import { createSurfaceElements } from "./surface";
import { makeCallbackCollection } from "./util";

const driver = midiremoteApi.makeDeviceDriver("Behringer", "X-Touch", "bjoluc.de");

const midiInput = driver.mPorts.makeMidiInput();
const midiOutput = driver.mPorts.makeMidiOutput();

// define all possible namings the devices MIDI ports could have
// NOTE: Windows and MacOS handle port naming differently
driver
  .makeDetectionUnit()
  .detectPortPair(midiInput, midiOutput)
  .expectInputNameEquals("X-Touch")
  .expectOutputNameEquals("X-Touch");

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

const elements = createSurfaceElements(driver.mSurface);

bindSurfaceElementsToMidi(elements, midiInput, midiOutput);

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

const trackPage = driver.mMapping.makePage("Default");
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
