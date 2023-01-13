import midiremoteApi from "midiremote_api_v1";

import { bindSurfaceElementsToMidi } from "./midi";
import { LcdManager } from "./midi/LcdManager";
import { createSurfaceElements } from "./surface";
import { makePage } from "./util/mapping";

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

const lcdManager = new LcdManager(midiOutput);

const trackPage = makePage(driver, "Track");
const mixerBankZone = trackPage.mHostAccess.mMixConsole.makeMixerBankZone("Current Bank");

elements.channels.map((channelElements, index) => {
  const channel = mixerBankZone.makeMixerBankChannel();

  // Push encoder
  trackPage.makeValueBinding(channelElements.encoder.mEncoderValue, channel.mValue.mPan);

  // Scribble strip
  trackPage.makeCallbackBinding(channel, "mOnTitleChange", (context, mapping, title) => {
    lcdManager.setChannelText(context, 1, index, LcdManager.abbreviateString(title));
  });

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
