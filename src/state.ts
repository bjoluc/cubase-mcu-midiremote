import { BooleanContextStateVariable, ObservableContextStateVariable } from "/util";

/** Declares some global context-dependent variables that (may) affect multiple devices */
export const createGlobalState = () => ({
  areMotorsActive: new BooleanContextStateVariable(),

  isValueDisplayModeActive: new BooleanContextStateVariable(),

  areDisplayRowsFlipped: new BooleanContextStateVariable(),

  isFlipModeActive: new BooleanContextStateVariable(),

  isShiftModeActive: new BooleanContextStateVariable<[MR_ActiveMapping]>(),

  areChannelMetersEnabled: new BooleanContextStateVariable(),

  isGlobalLcdMeterModeVertical: new BooleanContextStateVariable(),

  shouldMeterOverloadsBeCleared: new BooleanContextStateVariable(true),
});

export type GlobalState = ReturnType<typeof createGlobalState>;
