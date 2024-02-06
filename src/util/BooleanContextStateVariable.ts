import { ObservableContextStateVariable } from "./ObservableContextStateVariable";

export class BooleanContextStateVariable<
  AdditionalCallbackParameterType extends any[],
> extends ObservableContextStateVariable<boolean, AdditionalCallbackParameterType> {
  constructor(initialValue = false) {
    super(initialValue);
  }

  toggle(context: MR_ActiveDevice, ...parameters: AdditionalCallbackParameterType) {
    this.set(context, !this.get(context), ...parameters);
  }
}
