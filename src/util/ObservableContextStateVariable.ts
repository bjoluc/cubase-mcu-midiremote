import { ContextStateVariable } from "./ContextStateVariable";

export class ObservableContextStateVariable<
  ValueType,
  AdditionalCallbackParameterType extends any[] = [],
> {
  private variable: ContextStateVariable<ValueType>;
  private onChangeCallbacks: Array<{
    callback: (
      context: MR_ActiveDevice,
      newValue: ValueType,
      ...parameters: AdditionalCallbackParameterType
    ) => void;
    priority: number;
  }> = [];
  private areCallbacksSorted = true;

  constructor(initialValue: ValueType) {
    this.variable = new ContextStateVariable<ValueType>(initialValue);
    this.get = this.variable.get.bind(this.variable);
  }

  addOnChangeCallback(
    callback: (
      context: MR_ActiveDevice,
      newValue: ValueType,
      ...parameters: AdditionalCallbackParameterType
    ) => void,
    priority = 1,
  ) {
    this.onChangeCallbacks.push({ callback, priority });
    if (priority !== 1) {
      this.areCallbacksSorted = false;
    }
  }

  set(context: MR_ActiveDevice, value: ValueType, ...parameters: AdditionalCallbackParameterType) {
    this.variable.set(context, value);

    if (!this.areCallbacksSorted) {
      this.onChangeCallbacks.sort((a, b) => a.priority - b.priority);
      this.areCallbacksSorted = true;
    }

    for (const { callback } of this.onChangeCallbacks) {
      callback(context, value, ...parameters);
    }
  }

  get: ContextStateVariable<ValueType>["get"];
}
