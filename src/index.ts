import { ColorManager } from "./ColorManager";
import { LcdManager } from "./LcdManager";
import { makeButtonValueChangeHandler } from "./util/midi";
import { createElements } from "./util";
import { makePage } from "./util/mapping";

// @ts-ignore require is not typed here, but the if we `import` and transpile, Cubase fails to
// detect the script.
const midiremote_api = require("midiremote_api_v1") as MR_MidiRemoteAPI;

// create the device driver main object
const deviceDriver = midiremote_api.makeDeviceDriver("Behringer", "X-Touch", "bjoluc");

// create objects representing the hardware's MIDI ports
const midiInput = deviceDriver.mPorts.makeMidiInput();
const midiOutput = deviceDriver.mPorts.makeMidiOutput();

// define all possible namings the devices MIDI ports could have
// NOTE: Windows and MacOS handle port naming differently
deviceDriver
  .makeDetectionUnit()
  .detectPortPair(midiInput, midiOutput)
  .expectInputNameEquals("X-Touch")
  .expectOutputNameEquals("X-Touch");

function setMidiPorts(binding: MR_SurfaceValueMidiBinding) {
  return binding.setInputPort(midiInput).setOutputPort(midiOutput);
}

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

// create control element representing your hardware's surface

const surface = deviceDriver.mSurface;

surface.makeBlindPanel(0, 0, 28, 18).setShapeRectangle();

const encoders = createElements(8, (index) => {
  const encoder = surface.makePushEncoder(index * 2 + 0.5, 1.5, 2, 2);
  surface.makeLabelField(index * 2 + 0.5, 3.5, 2, 1).relateTo(encoder);
  return encoder;
});

const recordButtons = createElements(8, (index) => surface.makeButton(index * 2 + 1, 5, 1, 0.75));
const soloButtons = createElements(8, (index) => surface.makeButton(index * 2 + 1, 6, 1, 0.75));
const muteButtons = createElements(8, (index) => surface.makeButton(index * 2 + 1, 7, 1, 0.75));
const selectButtons = createElements(8, (index) => surface.makeButton(index * 2 + 1, 8, 1, 0.75));

const faders = createElements(9, (index) => surface.makeFader(index * 2 + 1, 10, 1, 6));
const mainFader = faders[8];

// Bind elements to MIDI events

const colorManager = new ColorManager(midiOutput);
const lcdManager = new LcdManager(midiOutput);

encoders.forEach((encoder, index) => {
  setMidiPorts(encoder.mEncoderValue.mMidiBinding)
    .bindToControlChange(0, 16 + index)
    .setTypeRelativeSignedBit();

  setMidiPorts(encoder.mPushValue.mMidiBinding).bindToNote(0, 32 + index);

  encoder.mEncoderValue.mOnColorChange = (device, r, g, b, _a, isColorAssigned) => {
    colorManager.setChannelColorRgb(device, index, r, g, b);
  };
});

[...recordButtons, ...soloButtons, ...muteButtons, ...selectButtons].forEach((button, index) => {
  setMidiPorts(button.mSurfaceValue.mMidiBinding).bindToNote(0, index);
  button.mSurfaceValue.mOnProcessValueChange = makeButtonValueChangeHandler(midiOutput, index);
});

faders.forEach((fader, index) => {
  setMidiPorts(fader.mSurfaceValue.mMidiBinding).bindToPitchBend(index);

  fader.mSurfaceValue.mOnProcessValueChange = (context, newValue, difference) => {
    if (difference !== 0) {
      console.log(`${difference}`);
      newValue *= 0x3fff;
      var lowByte = newValue & 0x7f;
      var highByte = newValue >> 7;

      midiOutput.sendMidi(context, [0xe0 + index, lowByte, highByte]);
    }
  };
});

// const lowerScribbleStrips = createElements(8, (index) => {
//   const scribbleStrip = surface.makeCustomValueVariable("scribbleStrip");
//   scribbleStrip.mOnTitleChange = function (activeDevice, objectTitle, valueTitle) {
//     console.log(objectTitle);
//   };
// });

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

const trackPage = makePage(deviceDriver, "Track");
const mixerBankZone = trackPage.mHostAccess.mMixConsole.makeMixerBankZone("Current Bank");

createElements(8, (index) => {
  const channel = mixerBankZone.makeMixerBankChannel();

  // Push encoders
  trackPage.makeValueBinding(encoders[index].mEncoderValue, channel.mValue.mPan);

  // Scribble strips
  trackPage.makeCallbackBinding(channel, "mOnTitleChange", (device, mapping, title) => {
    lcdManager.setChannelText(device, 1, index, LcdManager.abbreviateString(title));
  });

  // Record buttons
  trackPage
    .makeValueBinding(recordButtons[index].mSurfaceValue, channel.mValue.mRecordEnable)
    .setTypeToggle();

  // Solo buttons
  trackPage
    .makeValueBinding(soloButtons[index].mSurfaceValue, channel.mValue.mSolo)
    .setTypeToggle();

  // Mute buttons
  trackPage
    .makeValueBinding(muteButtons[index].mSurfaceValue, channel.mValue.mMute)
    .setTypeToggle();

  // Select buttons
  trackPage
    .makeValueBinding(selectButtons[index].mSurfaceValue, channel.mValue.mSelected)
    .setTypeToggle();

  // Faders
  trackPage.makeValueBinding(faders[index].mSurfaceValue, channel.mValue.mVolume);
});
