import { EnhancedMidiOutput } from "/midi/PortPair";

export interface DecoratedLamp extends MR_Lamp {
  bindToNote: (output: EnhancedMidiOutput, note: number) => void;
}

export interface DecoratedDeviceSurface extends MR_DeviceSurface {
  makeDecoratedLamp: (...args: Parameters<MR_DeviceSurface["makeLamp"]>) => DecoratedLamp;
}

export function decorateSurface(surface: MR_DeviceSurface) {
  const decoratedSurface = surface as DecoratedDeviceSurface;

  decoratedSurface.makeDecoratedLamp = (...args) => {
    const lamp = decoratedSurface.makeLamp(...args) as DecoratedLamp;

    lamp.bindToNote = (output, note) => {
      lamp.mSurfaceValue.mOnProcessValueChange = (context, value) => {
        output.sendNoteOn(context, note, value);
      };
    };

    return lamp;
  };

  return decoratedSurface;
}
