import { BooleanContextVariable, ObservableContextVariable } from "/util";

/** Declares some global context-dependent variables that (may) affect multiple devices */
export const createGlobalState = () => ({
  areMotorsActive: new BooleanContextVariable(),

  isValueDisplayModeActive: new BooleanContextVariable(),

  areDisplayRowsFlipped: new BooleanContextVariable(),

  isFlipModeActive: new BooleanContextVariable(),

  isShiftModeActive: new BooleanContextVariable<[MR_ActiveMapping]>(),

  areChannelMetersEnabled: new BooleanContextVariable(),

  isGlobalLcdMeterModeVertical: new BooleanContextVariable(),

  shouldMeterOverloadsBeCleared: new BooleanContextVariable(true),
});

export type GlobalState = ReturnType<typeof createGlobalState>;
