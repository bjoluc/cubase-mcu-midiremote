// Polyfills
// organize-imports-ignore
import "core-js/actual/array/iterator";
import "core-js/actual/array/from";
import "core-js/actual/array/reverse";
import "core-js/actual/array/flat-map";
import "core-js/actual/string/pad-start";
import "core-js/actual/string/replace-all";
import "core-js/actual/object/entries";
import "core-js/actual/reflect/construct";

// @ts-ignore Workaround because the core-js polyfill doesn't play nice with SWC:
Reflect.get = undefined;

import midiremoteApi from "midiremote_api_v1";
import { decoratePage } from "./decorators/page";
import { decorateSurface } from "./decorators/surface";
import { createDevices } from "./devices";
import { makeHostMapping } from "./mapping";
import { bindDeviceToMidi } from "./midi";
import { setupDeviceConnection } from "./midi/connection";
import { makeTimerUtils } from "./util";
import { createGlobalState } from "./state";

const driver = midiremoteApi.makeDeviceDriver(VENDOR_NAME, DEVICE_NAME, "github.com/bjoluc");

const surface = decorateSurface(driver.mSurface);

const globalState = createGlobalState();
const page = decoratePage(driver.mMapping.makePage("Mixer"), surface);
const timerUtils = makeTimerUtils(driver, page, surface);

// Create devices, i.e., midi ports, managers, and surface elements for each physical device
const devices = createDevices(driver, surface, globalState, timerUtils);

const { activationCallbacks, segmentDisplayManager } = setupDeviceConnection(driver, devices);
activationCallbacks.addCallback(() => {
  console.log("Activating cubase-mcu-midiremote v" + SCRIPT_VERSION);
  console.log(
    "A newer version may be available at https://github.com/bjoluc/cubase-mcu-midiremote/releases",
  );
});

activationCallbacks.addCallback((context) => {
  globalState.areMotorsActive.set(context, true);
});

// Bind elements to MIDI
for (const device of devices) {
  bindDeviceToMidi(device, globalState, activationCallbacks);
}

// Map elements to host functions
makeHostMapping(page, devices, segmentDisplayManager, globalState, activationCallbacks);

if (DEVICE_NAME === "MCU Pro") {
  // Initially disable LCD channel metering for all devices
  activationCallbacks.addCallback((context) => {
    globalState.isGlobalLcdMeterModeVertical.set(context, true);
    globalState.areChannelMetersEnabled.set(context, false);
  });

  // Clear meter overloads when playback is started
  page.mHostAccess.mTransport.mValue.mStart.mOnProcessValueChange = (context, mapping, value) => {
    const isPlaybackActive = Boolean(value);
    if (isPlaybackActive !== globalState.shouldMeterOverloadsBeCleared.get(context)) {
      globalState.shouldMeterOverloadsBeCleared.set(context, isPlaybackActive);
    }
  };
}
