const USE_EXTENDER = true;
const IS_EXTENDER_LEFT = true;

// Polyfills
import "core-js/es/array/flat-map";
import "core-js/es/string/replace-all";

import midiremoteApi from "midiremote_api_v1";
import { createHostMapping } from "./mapping";
import { bindSurfaceElementsToMidi } from "./midi";
import { setupDeviceConnection } from "./midi/connection";
import { MidiPorts } from "./midi/MidiPorts";
import { createSurfaceElements } from "./surface";

const driver = midiremoteApi.makeDeviceDriver("Behringer", "X-Touch", "bjoluc.de");

const ports = new MidiPorts(driver, USE_EXTENDER, IS_EXTENDER_LEFT);

const { activationCallbacks, midiManagers } = setupDeviceConnection(driver, ports);

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

const elements = createSurfaceElements(driver.mSurface, ports.getChannelCount());

bindSurfaceElementsToMidi(elements, ports, midiManagers, activationCallbacks);

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

createHostMapping(driver.mMapping, elements, midiremoteApi.mDefaults, activationCallbacks);
