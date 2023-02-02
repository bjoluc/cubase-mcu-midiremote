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
