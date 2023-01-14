import midiremoteApi from "midiremote_api_v1";
import { createHostMapping } from "./mapping";
import { bindSurfaceElementsToMidi } from "./midi";
import { createSurfaceElements } from "./surface";

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

createHostMapping(driver.mMapping, elements);
