// Polyfills
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
import { bindDeviceToMidi, createGlobalBooleanVariables } from "./midi";
import { setupDeviceConnection } from "./midi/connection";
import { makeTimerUtils } from "./util";

const driver = midiremoteApi.makeDeviceDriver(VENDOR_NAME, DEVICE_NAME, "github.com/bjoluc");

const surface = decorateSurface(driver.mSurface);

const globalBooleanVariables = createGlobalBooleanVariables();
const page = decoratePage(driver.mMapping.makePage("Mixer"), surface);
const timerUtils = makeTimerUtils(driver, page, surface);

// Create devices, i.e., midi ports, managers, and surface elements for each physical device
const devices = createDevices(driver, surface, globalBooleanVariables, timerUtils);

const { activationCallbacks, segmentDisplayManager } = setupDeviceConnection(driver, devices);
activationCallbacks.addCallback(() => {
  console.log("Activating cubase-mcu-midiremote v" + SCRIPT_VERSION);
  console.log(
    "A newer version may be available at https://github.com/bjoluc/cubase-mcu-midiremote/releases"
  );
});

activationCallbacks.addCallback((context) => {
  globalBooleanVariables.areMotorsActive.set(context, true);
});

// Bind elements to MIDI
for (const device of devices) {
  bindDeviceToMidi(device, globalBooleanVariables, activationCallbacks);
}

// Map elements to host functions
makeHostMapping(page, devices, segmentDisplayManager, globalBooleanVariables, activationCallbacks);

if (DEVICE_NAME === "MCU Pro") {
  // Initially disable LCD channel metering for all devices
  activationCallbacks.addCallback((context) => {
    globalBooleanVariables.isGlobalLcdMeterModeVertical.set(context, true);
    globalBooleanVariables.areChannelMetersEnabled.set(context, false);
  });

  // Clear meter overloads when playback is started
  page.mHostAccess.mTransport.mValue.mStart.mOnProcessValueChange = (context, mapping, value) => {
    const isPlaybackActive = Boolean(value);
    if (isPlaybackActive !== globalBooleanVariables.shouldMeterOverloadsBeCleared.get(context)) {
      globalBooleanVariables.shouldMeterOverloadsBeCleared.set(context, isPlaybackActive);
    }
  };
}
