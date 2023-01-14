import { createElements } from "./util";

export function createSurfaceElements(surface: MR_DeviceSurface) {
  surface.makeBlindPanel(0, 0, 66, 40); // Frame
  surface.makeBlindPanel(41, 6, 23.25, 4); // Time display
  surface.makeBlindPanel(53, 29.25, 8.5, 8.5).setShapeCircle(); // Jog wheel

  function makeSquareButton(x: number, y: number) {
    return surface.makeButton(x + 0.25, y, 1.5, 1.5);
  }

  const miscControlButtons = createElements(21, (index) =>
    makeSquareButton(
      46 + (index % 7) * 2.625,
      17 + Math.floor(index / 7) * 2.5 + (index < 14 ? 0 : 0.5)
    )
  );
  function getMiscControlButtons(indices: number[]) {
    return indices.map((index) => miscControlButtons[index]);
  }

  return {
    channels: createElements(8, (index) => {
      const encoder = surface.makePushEncoder(index * 5 + 1, 3, 4, 4);
      surface.makeLabelField(index * 5 + 1, 7, 4, 2).relateTo(encoder);

      return {
        encoder,
        encoderDisplayMode: surface.makeCustomValueVariable("encoderDisplayMode"),
        scribbleStrip: {
          row1: surface.makeCustomValueVariable("scribbleStripRow1"),
          row2: surface.makeCustomValueVariable("scribbleStripRow2"),
        },
        buttons: {
          record: makeSquareButton(2 + index * 5, 10),
          solo: makeSquareButton(2 + index * 5, 12),
          mute: makeSquareButton(2 + index * 5, 14),
          select: surface.makeButton(2 + index * 5, 16, 2, 1.5),
        },
        fader: surface.makeFader(2 + index * 5, 20, 2, 16),
        faderTouched: surface.makeCustomValueVariable("faderTouched"),
      };
    }),

    control: {
      mainFader: surface.makeFader(42, 20, 2, 16),
      mainFaderTouched: surface.makeCustomValueVariable("mainFaderTouched"),
      buttons: {
        display: makeSquareButton(42, 7.25),
        timeMode: makeSquareButton(61.75, 7.25),
        edit: surface.makeButton(42, 10.5, 2, 1.5),
        flip: surface.makeButton(42, 16, 2, 1.5),

        encoderAssign: createElements(6, (index) => makeSquareButton(42 + index * 2.25, 3.5)),
        number: createElements(8, (index) => makeSquareButton(46 + index * 2.25, 10.5)),
        function: createElements(8, (index) => makeSquareButton(46 + index * 2.25, 14)),
        modify: getMiscControlButtons([0, 1, 7, 8]),
        automation: getMiscControlButtons([2, 3, 4, 9, 10, 11]),
        utility: getMiscControlButtons([5, 6, 12, 13]),
        transport: [
          ...miscControlButtons.slice(14),
          ...createElements(5, (index) => surface.makeButton(46.25 + index * 3.56, 25, 3, 2)),
        ],

        navigation: {
          bank: {
            left: makeSquareButton(46.75, 28),
            right: makeSquareButton(49.25, 28),
          },
          channel: {
            left: makeSquareButton(46.75, 30),
            right: makeSquareButton(49.25, 30),
          },
          directions: {
            left: makeSquareButton(46.25, 34),
            right: makeSquareButton(49.75, 34),
            up: makeSquareButton(48, 32.25),
            center: makeSquareButton(48, 34),
            down: makeSquareButton(48, 35.75),
          },
        },

        scrub: makeSquareButton(61.75, 28),
      },
    },
  };
}

export type SurfaceElements = ReturnType<typeof createSurfaceElements>;
