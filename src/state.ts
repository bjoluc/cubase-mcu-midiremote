import { config } from "./config";
import { BooleanContextVariable, ObservableContextVariable } from "/util";

/** Declares some global context-dependent variables that (may) affect multiple devices */
export const createGlobalState = () => ({
  areMotorsActive: new BooleanContextVariable(),

  isValueDisplayModeActive: new BooleanContextVariable(),

  areDisplayRowsFlipped: new BooleanContextVariable(config.flipDisplayRowsByDefault),

  isFlipModeActive: new BooleanContextVariable(),

  isShiftModeActive: new BooleanContextVariable<[MR_ActiveMapping]>(),

  areChannelMetersEnabled: new BooleanContextVariable(),

  isGlobalLcdMeterModeVertical: new BooleanContextVariable(),

  shouldMeterOverloadsBeCleared: new BooleanContextVariable(true),

  selectedTrackName: new ObservableContextVariable(""),
});

export type GlobalState = ReturnType<typeof createGlobalState>;
