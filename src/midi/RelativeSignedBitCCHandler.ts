export class RelativeSignedBitCCHandler {
  private static nextVariableId = 0;

  private variable = this.surface.makeCustomValueVariable(
    "RelativeSignedBitCCHandler" + RelativeSignedBitCCHandler.nextVariableId++,
  );

  private previousValue = this.surface.makeCustomValueVariable(
    "RelativeSignedBitCCHandler" + RelativeSignedBitCCHandler.nextVariableId++,
  );

  private handleProcessValueChange = (context: MR_ActiveDevice, value: number) => {
    const previousValue = this.previousValue.getProcessValue(context);

    let difference = value - previousValue;

    if (previousValue === 0) {
      // This is the first time this callback is invoked – let's set the variables properly

      if (value === 0) {
        // The first action was a decrease the amount of which was lost to the surface variable's
        // lower bound – assuming the smallest value here
        difference = value = -1 / 0x7f;
      }

      this.previousValue.setProcessValue(context, 0.5);
      this.variable.setProcessValue(context, 0.5);
    } else {
      // Prevent value from reaching its limits
      const jumpOffset = 32 / 128;

      if (value < 0.5 - jumpOffset) {
        this.previousValue.setProcessValue(context, value + jumpOffset);
        this.variable.setProcessValue(context, value + jumpOffset);
      } else if (value > 0.5 + jumpOffset) {
        this.previousValue.setProcessValue(context, value - jumpOffset);
        this.variable.setProcessValue(context, value - jumpOffset);
      } else {
        this.previousValue.setProcessValue(context, value);
      }
    }

    const integerDifference = Math.round(difference * 0x7f);

    if (integerDifference !== 0 && this.onDifferenceReceived) {
      this.onDifferenceReceived(context, difference, integerDifference);
    }
  };

  constructor(private surface: MR_DeviceSurface) {
    this.variable.mOnProcessValueChange = this.handleProcessValueChange;
  }

  bindToCC(inputPort: MR_DeviceMidiInput, controllerNumber: number) {
    this.variable.mMidiBinding
      .setInputPort(inputPort)
      .bindToControlChange(0, controllerNumber)
      .setTypeRelativeSignedBit();
  }
}

export interface RelativeSignedBitCCHandler {
  onDifferenceReceived?: (
    context: MR_ActiveDevice,
    difference: number,
    integerDifference: number,
  ) => void;
}
