import { ObservableContextVariable } from "./ObservableContextVariable";

export class BooleanContextVariable<
  AdditionalCallbackParameterType extends any[],
> extends ObservableContextVariable<boolean, AdditionalCallbackParameterType> {
  constructor(initialValue = false) {
    super(initialValue);
  }

  toggle(context: MR_ActiveDevice, ...parameters: AdditionalCallbackParameterType) {
    this.set(context, !this.get(context), ...parameters);
  }
}
