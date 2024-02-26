export class CallbackCollection<
  Object extends Record<string, any>,
  CallbackName extends keyof Object,
  CallbackArguments extends Parameters<Object[CallbackName]> = Parameters<Object[CallbackName]>,
  CallbackType extends (...args: CallbackArguments) => void = (...args: CallbackArguments) => void,
> {
  private callbacks: Array<CallbackType> = [];

  constructor(object: Object, callbackName: CallbackName) {
    // @ts-expect-error Filtering callback method names is not worth the effort here
    object[callbackName] = (...args: CallbackArguments) => {
      for (const callback of this.callbacks) {
        callback(...args);
      }
    };
  }

  addCallback = (callback: CallbackType) => {
    this.callbacks.push(callback);
  };
}
