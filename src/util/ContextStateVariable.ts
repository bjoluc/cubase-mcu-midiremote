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
 *
 * Originally, `ContextStateVariable` was using JSON (de)serialization along with
 * `context.setState()` and `context.getState()` to store the variable values as strings in the
 * context itself. This approach would have allowed for multiple active devices of the same script
 * at the same time – which is not a supported scenario of this script anyway. Hence, the current
 * implementation uses a minimalistic "reset to default when the device context changes" approach –
 * presuming that there is only one active script instance at any time.
 */
export class ContextStateVariable<ValueType> {
  private lastContext?: MR_ActiveDevice;
  private value = this.initialValue;

  private hasContextChanged(context: MR_ActiveDevice) {
    if (this.lastContext === context) {
      return false;
    }

    this.lastContext = context;
    return true;
  }

  constructor(private initialValue: ValueType) {}

  set(context: MR_ActiveDevice, value: ValueType) {
    this.hasContextChanged(context);
    this.value = value;
  }

  get(context: MR_ActiveDevice): ValueType {
    if (this.hasContextChanged(context)) {
      this.value = this.initialValue;
    }

    return this.value;
  }
}
