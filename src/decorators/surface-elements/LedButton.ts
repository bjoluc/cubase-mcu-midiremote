import { MidiPortPair } from "/midi/MidiPortPair";
import { ContextStateVariable, makeCallbackCollection } from "/util";

interface LedButtonOptions {
  /**
   * The position and size of the button. If omitted, the button will be hidden.
   */
  position?: [x: number, y: number, w: number, h: number];

  /**
   * Whether or not the button belongs to a channel on the device. Defaults to `false`.
   */
  isChannelButton?: boolean;
}

class LedButtonDecorator {
  /**
   * Binding the button's `mSurfaceValue` to a host function may alter it to not change when the
   * button is pressed. In order to reliably detect when the button is pressed, we create a
   * `shadowValue` variable that is bound to the same note.
   */
  private shadowValue = this.surface.makeCustomValueVariable("LedButtonProxy");
  private ledValue = new ContextStateVariable(0);

  private ports?: MidiPortPair;
  private note?: number;

  constructor(
    private surface: MR_DeviceSurface,
    private button: MR_Button,
    private readonly options: LedButtonOptions,
  ) {}

  onSurfaceValueChange = makeCallbackCollection(this.button.mSurfaceValue, "mOnProcessValueChange");

  setLedValue = (context: MR_ActiveDevice, value: number) => {
    this.ledValue.set(context, value);
    if (this.ports && typeof this.note !== "undefined") {
      this.ports.output.sendNoteOn(context, this.note, value);
    }
  };

  bindToNote = (ports: MidiPortPair, note: number) => {
    this.ports = ports;
    this.note = note;

    this.button.mSurfaceValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, note);
    this.onSurfaceValueChange.addCallback((context, newValue) => {
      ports.output.sendNoteOn(context, note, newValue || this.ledValue.get(context));
    });

    // Binding the button's mSurfaceValue to a host function may alter it to not change when the
    // button is pressed. Hence, `shadowValue` is used to make the button light up while it's
    // pressed.
    this.shadowValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, note);
    this.shadowValue.mOnProcessValueChange = (context, newValue) => {
      ports.output.sendNoteOn(
        context,
        note,
        newValue ||
          this.button.mSurfaceValue.getProcessValue(context) ||
          this.ledValue.get(context),
      );
    };

    if (this.options.isChannelButton) {
      // Turn the button's LED off when it becomes unassigned
      this.button.mSurfaceValue.mOnTitleChange = (context, title) => {
        if (title === "") {
          ports.output.sendNoteOn(context, note, 0);
        }
      };
    }
  };
}

/**
 * An extension to MR_Button that
 *
 *  * provides a `setLedValue` method which can be used to enable or disable the button's LED
 *    independently of the button's `mSurfaceValue`.
 *  * always lights up the button's LED while the button is being held down
 *  * can be configured to be invisible
 */
export class LedButton extends LedButtonDecorator {
  constructor(surface: MR_DeviceSurface, options: LedButtonOptions = {}) {
    const button: MR_Button = options.position
      ? surface.makeButton(...options.position)
      : {
          mSurfaceValue: surface.makeCustomValueVariable("HiddenLedButton"),
          setControlLayer: () => button,
          setShapeCircle: () => button,
          setShapeRectangle: () => button,
          setTypePush: () => button,
          setTypeToggle: () => button,
        };

    super(surface, button, options);

    return Object.assign(button, this);
  }
}

// TS merges this declaration with the `LedButton` class above
export interface LedButton extends MR_Button {
  setControlLayer: (controlLayer: MR_ControlLayer) => LedButton;
  setShapeCircle: () => LedButton;
  setShapeRectangle: () => LedButton;
  setTypePush: () => LedButton;
  setTypeToggle: () => LedButton;
}
