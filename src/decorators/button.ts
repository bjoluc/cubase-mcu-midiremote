import { PortPair } from "../midi/PortPair";
import { CallbackCollection, ContextStateVariable, makeCallbackCollection } from "../util";

export interface LedButton extends MR_Button {
  mLedValue: MR_SurfaceCustomValueVariable;
  onSurfaceValueChange: CallbackCollection<
    Parameters<MR_Button["mSurfaceValue"]["mOnProcessValueChange"]>
  >;
  bindToNote: (ports: PortPair, note: number, isChannelButton?: boolean) => void;
}

export function enhanceButtonToLedButton(originalButton: MR_Button, surface: MR_DeviceSurface) {
  const button = originalButton as LedButton;

  button.onSurfaceValueChange = makeCallbackCollection(
    button.mSurfaceValue,
    "mOnProcessValueChange"
  );
  button.mLedValue = surface.makeCustomValueVariable("LedButtonLed");

  const shadowValue = surface.makeCustomValueVariable("LedButtonProxy");

  button.bindToNote = (ports, note, isChannelButton = false) => {
    const currentSurfaceValue = new ContextStateVariable(0);
    button.mSurfaceValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, note);
    button.onSurfaceValueChange.addCallback((context, newValue) => {
      currentSurfaceValue.set(context, newValue);
      ports.output.sendNoteOn(context, note, newValue || currentLedValue.get(context));
    });

    const currentLedValue = new ContextStateVariable(0);
    button.mLedValue.mOnProcessValueChange = (context, newValue) => {
      currentLedValue.set(context, newValue);
      ports.output.sendNoteOn(context, note, newValue);
    };

    // Binding the button's mSurfaceValue to a host function may alter it to not change when the
    // button is pressed. Hence, `shadowValue` is used to make the button light up while it's
    // pressed.
    shadowValue.mMidiBinding.setInputPort(ports.input).bindToNote(0, note);
    shadowValue.mOnProcessValueChange = (context, newValue) => {
      ports.output.sendNoteOn(
        context,
        note,
        newValue || currentSurfaceValue.get(context) || currentLedValue.get(context)
      );
    };

    if (isChannelButton) {
      // Turn the button's LED off when it becomes unassigned
      button.mSurfaceValue.mOnTitleChange = (context, title) => {
        if (title === "") {
          ports.output.sendNoteOn(context, note, 0);
        }
      };
    }
  };

  return button;
}
