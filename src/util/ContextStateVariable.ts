/**
 * A `ContextStateVariable` maintains a value which depends on the device context
 * (`MR_ActiveDevice`).
 *
 * Why?
 *
 * During the lifetime of a MIDI Remote script, several "script instances" may be created. For
 * instance, when disabling a controller script (via the MIDI Remote Manager) and enabling it again,
 * plain JS variables in the script keep their values while the `MR_ActiveDevice` changes.
 * `ContextStateVariable`s limit the lifetime of their values to the lifetime of the device context
 * (`MR_ActiveDevice`).
 */
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
