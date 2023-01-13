import { createElements } from "./util";

export function createSurfaceElements(surface: MR_DeviceSurface) {
  surface.makeBlindPanel(0, 0, 28, 18).setShapeRectangle();

  return {
    channels: createElements(8, (index) => {
      const encoder = surface.makePushEncoder(index * 2 + 0.5, 1.5, 2, 2);
      surface.makeLabelField(index * 2 + 0.5, 3.5, 2, 1).relateTo(encoder);

      return {
        encoder,
        buttons: {
          record: surface.makeButton(index * 2 + 1, 5, 1, 0.75),
          solo: surface.makeButton(index * 2 + 1, 6, 1, 0.75),
          mute: surface.makeButton(index * 2 + 1, 7, 1, 0.75),
          select: surface.makeButton(index * 2 + 1, 8, 1, 0.75),
        },
        fader: surface.makeFader(index * 2 + 1, 10, 1, 6),
      };
    }),
  };
}

export type SurfaceElements = ReturnType<typeof createSurfaceElements>;
