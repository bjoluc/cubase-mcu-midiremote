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
