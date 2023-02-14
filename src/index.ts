// Polyfills
import "core-js/es/array/iterator";
import "core-js/es/array/from";
import "core-js/es/array/reverse";
import "core-js/es/array/flat-map";
import "core-js/es/string/pad-start";
import "core-js/es/string/replace-all";
import "core-js/es/object/entries";

import midiremoteApi from "midiremote_api_v1";
import { decoratePage } from "./decorators/page";
import { decorateSurface } from "./decorators/surface";
import { makeHostMapping } from "./mapping";
import { bindSurfaceElementsToMidi } from "./midi";
import { setupDeviceConnection } from "./midi/connection";
import { MidiPorts } from "./midi/MidiPorts";
import { createSurfaceElements } from "./surface";
import { makeTimerUtils } from "./util";

const driver = midiremoteApi.makeDeviceDriver("Behringer", "X-Touch", "github.com/bjoluc");

const ports = new MidiPorts(driver);

const { activationCallbacks, midiManagers } = setupDeviceConnection(driver, ports);
activationCallbacks.addCallback(() => {
  // @ts-expect-error The script version is filled in by esbuild
  console.log("Activating cubase-xtouch-midiremote v" + SCRIPT_VERSION);
  console.log(
    "A newer version may be available at https://github.com/bjoluc/cubase-xtouch-midiremote/releases"
  );
});

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

const surface = decorateSurface(driver.mSurface);
const elements = createSurfaceElements(surface, ports.getChannelCount());

const page = decoratePage(driver.mMapping.makePage("Mixer"), surface);
const timerUtils = makeTimerUtils(page, surface);

bindSurfaceElementsToMidi(elements, ports, midiManagers, activationCallbacks, timerUtils);

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

makeHostMapping(page, elements, midiremoteApi.mDefaults);
