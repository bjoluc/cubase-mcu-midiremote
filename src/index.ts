// Polyfills
import "core-js/es/array/iterator";
import "core-js/es/array/from";
import "core-js/es/array/reverse";
import "core-js/es/array/flat-map";
import "core-js/es/string/pad-start";
import "core-js/es/string/replace-all";
import "core-js/es/object/entries";
import "core-js/es/reflect/construct";

// @ts-ignore Workaround because the core-js polyfill doesn't play nice with SWC:
Reflect.get = undefined;

import midiremoteApi from "midiremote_api_v1";
import { createDevices } from "./devices";
import { decoratePage } from "./decorators/page";
import { decorateSurface } from "./decorators/surface";
import { makeHostMapping } from "./mapping";
import { bindDeviceToMidi, makeGlobalBooleanVariables } from "./midi";
import { setupDeviceConnection } from "./midi/connection";
import { makeTimerUtils } from "./util";

const driver = midiremoteApi.makeDeviceDriver(VENDOR_NAME, DEVICE_NAME, "github.com/bjoluc");

const surface = decorateSurface(driver.mSurface);

// Create devices, i.e., midi ports and surface elements for each physical device
const devices = createDevices(driver, surface);

const { activationCallbacks, segmentDisplayManager } = setupDeviceConnection(driver, devices);
activationCallbacks.addCallback(() => {
  console.log("Activating cubase-mcu-midiremote v" + SCRIPT_VERSION);
  console.log(
    "A newer version may be available at https://github.com/bjoluc/cubase-mcu-midiremote/releases"
  );
});

const globalBooleanVariables = makeGlobalBooleanVariables(surface);

activationCallbacks.addCallback((context) => {
  // Setting `runCallbacksInstantly` to `true` below is a workaround for
  // https://forums.steinberg.net/t/831123.
  globalBooleanVariables.areMotorsActive.set(context, true, true);
});

const page = decoratePage(driver.mMapping.makePage("Mixer"), surface);
const timerUtils = makeTimerUtils(page, surface);

// Bind elements to MIDI
devices.forEach((device) => {
  bindDeviceToMidi(device, globalBooleanVariables, activationCallbacks, timerUtils);
});

// Map elements to host functions
makeHostMapping(page, devices, segmentDisplayManager, globalBooleanVariables, activationCallbacks);
