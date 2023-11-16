export function createElements<E>(count: number, factoryFunction: (index: number) => E): E[] {
  const elements = [];
  for (let index = 0; index < count; index++) {
    elements.push(factoryFunction(index));
  }

  return elements;
}

/**
 * Given an array and a list of array indices, returns a new array consisting of the elements at the
 * original indices specified by the `indices` list.
 */
export function getArrayElements<T>(array: T[], indices: number[]) {
  return indices.map((index) => array[index]);
}

/**
 * A collection of callbacks that can be used as a callback itself.
 */
export interface CallbackCollection<A extends any[]> {
  (...args: A): void;
  addCallback(callback: (...args: A) => void): void;
}

export function makeCallbackCollection<
  O extends Record<string, any>,
  C extends keyof O,
  A extends Parameters<O[C]>
>(object: O, callbackName: C) {
  const callbacks: Array<(...args: A) => void> = [];

  const callbackCollection = ((...args: A) => {
    for (const callback of callbacks) {
      callback(...args);
    }
  }) as CallbackCollection<A>;

  callbackCollection.addCallback = (callback) => {
    callbacks.push(callback);
  };

  // @ts-expect-error
  object[callbackName] = callbackCollection;
  return callbackCollection;
}

/**
 * This hack allows to periodically invoke a function by combining a surface variable, a sub page,
 * and an action binding's `makeRepeating()`. It is no longer required in Cubase 13 (due to the new
 * `mOnIdle` callback), but left here for backwards compatibility.
 */
const setupLegacyTimer = (
  page: MR_FactoryMappingPage,
  surface: MR_DeviceSurface,
  onTick: (context: MR_ActiveDevice) => void
) => {
  let isLegacyTimerTicking = false;

  const timerPage = page.makeSubPageArea("Timer").makeSubPage("Timer Page");
  timerPage.mOnActivate = onTick;

  const triggerVariable = surface.makeCustomValueVariable("timerTrigger");
  page.makeActionBinding(triggerVariable, timerPage.mAction.mActivate).makeRepeating(1, 1);

  return {
    startLegacyTimer: (context: MR_ActiveDevice) => {
      isLegacyTimerTicking = true;
      triggerVariable.setProcessValue(context, 1);
    },
    stopLegacyTimer: (context: MR_ActiveDevice) => {
      isLegacyTimerTicking = false;
      triggerVariable.setProcessValue(context, 0);
    },
    isLegacyTimerTicking: () => isLegacyTimerTicking,
  };
};

export type TimerUtils = ReturnType<typeof makeTimerUtils>;

export function makeTimerUtils(
  driver: MR_DeviceDriver,
  page: MR_FactoryMappingPage,
  surface: MR_DeviceSurface
) {
  const timeouts: Record<
    string,
    { callback: (context: MR_ActiveDevice) => void; scheduledExecutionTime: number }
  > = {};

  let isIdleCallbackSupported = false;

  // Cubase 13 and above: Register an Idle Callback
  driver.mOnIdle = function (context) {
    if (!isIdleCallbackSupported) {
      isIdleCallbackSupported = true;
      stopLegacyTimer(context);
    }

    tick(context);
  };

  const tick = (context: MR_ActiveDevice) => {
    for (const [timeoutId, { scheduledExecutionTime, callback }] of Object.entries(timeouts)) {
      if (performance.now() >= scheduledExecutionTime) {
        callback(context);
        delete timeouts[timeoutId];
      }
    }

    if (isLegacyTimerTicking() && Object.keys(timeouts).length === 0) {
      stopLegacyTimer(context);
    }
  };

  const { isLegacyTimerTicking, startLegacyTimer, stopLegacyTimer } = setupLegacyTimer(
    page,
    surface,
    tick
  );

  /**
   * Registers a given callback function (identified by `timeoutId`) to be executed after `timeout`
   * seconds. Calling `setTimeout` again with the same `intervalId` resets the previously registered
   * timeout and overrides its callback.
   */
  const setTimeout = (
    context: MR_ActiveDevice,
    timeoutId: string,
    callback: (context: MR_ActiveDevice) => void,
    timeout: number
  ) => {
    if (!isIdleCallbackSupported && !isLegacyTimerTicking()) {
      startLegacyTimer(context);
    }

    timeouts[timeoutId] = { scheduledExecutionTime: performance.now() + timeout * 1000, callback };
  };

  return { setTimeout };
}

export class ContextStateVariable<ValueType> {
  private static nextVariableId = 0;
  private name = `contextStateVariable${ContextStateVariable.nextVariableId++}`;

  constructor(private initialValue: ValueType) {}

  set(context: MR_ActiveDevice, value: ValueType) {
    context.setState(this.name, JSON.stringify(value));
  }

  get(context: MR_ActiveDevice): ValueType {
    const state = context.getState(this.name);
    return state === "" ? this.initialValue : JSON.parse(state);
  }
}

export class ObservableContextStateVariable<ValueType> extends ContextStateVariable<ValueType> {
  private onChangeCallbacks: Array<(context: MR_ActiveDevice, newValue: ValueType) => void> = [];

  constructor(initialValue: ValueType) {
    super(initialValue);
  }

  addOnChangeCallback(callback: (context: MR_ActiveDevice, newValue: ValueType) => void) {
    this.onChangeCallbacks.push(callback);
  }

  set(context: MR_ActiveDevice, value: ValueType) {
    super.set(context, value);

    for (const callback of this.onChangeCallbacks) {
      callback(context, value);
    }
  }
}

export class BooleanContextStateVariable extends ObservableContextStateVariable<boolean> {
  constructor(initialValue = false) {
    super(initialValue);
  }

  toggle(context: MR_ActiveDevice) {
    this.set(context, !this.get(context));
  }
}
