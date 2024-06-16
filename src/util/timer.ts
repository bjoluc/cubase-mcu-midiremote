/**
 * This hack allows to periodically invoke a function by combining a surface variable, a sub page,
 * and an action binding's `makeRepeating()`. It is no longer required in Cubase 13 (due to the new
 * `mOnIdle` callback), but left here for backwards compatibility.
 */
const setupLegacyTimer = (
  page: MR_FactoryMappingPage,
  surface: MR_DeviceSurface,
  onTick: (context: MR_ActiveDevice) => void,
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
  surface: MR_DeviceSurface,
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
    tick,
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
    timeout: number,
  ) => {
    if (!isIdleCallbackSupported && !isLegacyTimerTicking()) {
      startLegacyTimer(context);
    }

    timeouts[timeoutId] = { scheduledExecutionTime: performance.now() + timeout * 1000, callback };
  };

  const clearTimeout = (timeoutId: string) => {
    delete timeouts[timeoutId];
  };

  return { setTimeout, clearTimeout };
}
