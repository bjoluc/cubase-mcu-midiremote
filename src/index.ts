// @ts-expect-error This is replaced by esbuild
const USE_EXTENDER = CONFIG_USE_EXTENDER;
const IS_EXTENDER_LEFT = true;

// Polyfills
import "core-js/es/array/flat-map";
import "core-js/es/string/replace-all";

import midiremoteApi from "midiremote_api_v1";
import { decoratePage } from "./decorators/page";
import { decorateSurface } from "./decorators/surface";
import { makeHostMapping } from "./mapping";
import { bindSurfaceElementsToMidi } from "./midi";
import { setupDeviceConnection } from "./midi/connection";
import { MidiPorts } from "./midi/MidiPorts";
import { createSurfaceElements } from "./surface";

const driver = midiremoteApi.makeDeviceDriver("Behringer", "X-Touch", "github.com/bjoluc");

const ports = new MidiPorts(driver, USE_EXTENDER, IS_EXTENDER_LEFT);

const { activationCallbacks, midiManagers } = setupDeviceConnection(driver, ports);

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

const surface = decorateSurface(driver.mSurface);
const elements = createSurfaceElements(surface, ports.getChannelCount());

bindSurfaceElementsToMidi(elements, ports, midiManagers, activationCallbacks);

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

const page = decoratePage(driver.mMapping.makePage("Mixer"), surface);
makeHostMapping(page, elements, midiremoteApi.mDefaults, activationCallbacks);
