export function createElements<E>(count: number, factoryFunction: (index: number) => E): E[] {
  const elements = [];
  for (let index = 0; index < count; index++) {
    elements.push(factoryFunction(index));
  }

  return elements;
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

export type TimerUtils = ReturnType<typeof makeTimerUtils>;

let isTimerTicking = false;
const timeouts: Record<
  string,
  { callback: (context: MR_ActiveDevice) => void; scheduledExecutionTime: number }
> = {};

/**
 * This is one **hell** of a hack: It resembles the functionality of a global `setTimeout` function
 * by combining a surface variable, a sub page, and an action binding's `makeRepeating()` xD
 */
export function makeTimerUtils(page: MR_FactoryMappingPage, surface: MR_DeviceSurface) {
  const timerPage = page.makeSubPageArea("Timer").makeSubPage("Timer Page");
  const triggerVariable = surface.makeCustomValueVariable("timerTrigger");

  page.makeActionBinding(triggerVariable, timerPage.mAction.mActivate).makeRepeating(1, 1);

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
    if (!isTimerTicking) {
      triggerVariable.setProcessValue(context, 1);
    }

    timeouts[timeoutId] = { scheduledExecutionTime: performance.now() + timeout * 1000, callback };
  };

  timerPage.mOnActivate = (context) => {
    for (const [timeoutId, { scheduledExecutionTime, callback }] of Object.entries(timeouts)) {
      if (performance.now() >= scheduledExecutionTime) {
        callback(context);
        delete timeouts[timeoutId];
      }
    }

    if (Object.keys(timeouts).length === 0) {
      isTimerTicking = false;
      triggerVariable.setProcessValue(context, 0);
    }
  };

  return { setTimeout };
}

export class ContextStateVariable<ValueType> {
  private static nextVariableId = 0;

  constructor(
    private initialValue: ValueType,
    private name: string = `contextStateVariable${ContextStateVariable.nextVariableId++}`
  ) {}

  set(context: MR_ActiveDevice, value: ValueType) {
    context.setState(this.name, JSON.stringify(value));
  }

  get(context: MR_ActiveDevice): ValueType {
    const state = context.getState(this.name);
    return state === "" ? this.initialValue : JSON.parse(state);
  }
}

type GlobalBooleanVariableChangeCallback = (context: MR_ActiveDevice, newValue: boolean) => void;

export class GlobalBooleanVariable {
  private static nextVariableId = 0;

  private surfaceVariable: MR_SurfaceCustomValueVariable;
  private onChangeCallbacks: GlobalBooleanVariableChangeCallback[] = [];

  private invokeCallbacks(context: MR_ActiveDevice, value: boolean) {
    for (const callback of this.onChangeCallbacks) {
      callback(context, value);
    }
  }

  constructor(surface: MR_DeviceSurface) {
    this.surfaceVariable = surface.makeCustomValueVariable(
      `globalBooleanVariable${GlobalBooleanVariable.nextVariableId++}`
    );
    this.surfaceVariable.mOnProcessValueChange = (context, value) => {
      this.invokeCallbacks(context, Boolean(value));
    };
  }

  addOnChangeCallback(callback: GlobalBooleanVariableChangeCallback) {
    this.onChangeCallbacks.push(callback);
  }

  set(context: MR_ActiveDevice, value: boolean, runCallbacksInstantly = false) {
    this.surfaceVariable.setProcessValue(context, +value);
    if (runCallbacksInstantly) {
      this.invokeCallbacks(context, value);
    }
  }

  get(context: MR_ActiveDevice) {
    return Boolean(this.surfaceVariable.getProcessValue(context));
  }

  toggle(context: MR_ActiveDevice, runCallbacksInstantly = false) {
    this.set(context, !this.get(context), runCallbacksInstantly);
  }
}
