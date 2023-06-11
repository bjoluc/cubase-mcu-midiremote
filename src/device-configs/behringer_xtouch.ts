/**
 * @vendor Behringer
 * @device X-Touch
 */

import { createElements } from "../util";
import { ChannelSurfaceElements, DeviceConfig } from ".";
import { DecoratedDeviceSurface } from "../decorators/surface";

const channelWidth = 5;
const channelElementsWidth = 8 * channelWidth;
const surfaceHeight = 40;

function makeSquareButton(surface: DecoratedDeviceSurface, x: number, y: number) {
  return surface.makeLedButton(x + 0.25, y, 1.5, 1.5);
}

function makeChannelElements(surface: DecoratedDeviceSurface, x: number): ChannelSurfaceElements[] {
  return createElements(8, (index) => {
    const currentChannelXPosition = x + index * channelWidth;
    const encoder = surface.makeLedPushEncoder(currentChannelXPosition + 1, 3, 4, 4);

    return {
      index,
      encoder,
      scribbleStrip: {
        encoderLabel: surface
          .makeLabelField(currentChannelXPosition + 1, 7, 4, 2)
          .relateTo(encoder),
        trackTitle: surface.makeCustomValueVariable("scribbleStripTrackTitle"),
      },
      vuMeter: surface.makeCustomValueVariable("vuMeter"),
      buttons: {
        record: makeSquareButton(surface, 2 + currentChannelXPosition, 10),
        solo: makeSquareButton(surface, 2 + currentChannelXPosition, 12),
        mute: makeSquareButton(surface, 2 + currentChannelXPosition, 14),
        select: surface.makeLedButton(2 + currentChannelXPosition, 16, 2, 1.5),
      },

      fader: surface.makeTouchSensitiveFader(2 + currentChannelXPosition, 20, 2, 16),
    };
  });
}

export const deviceConfig: DeviceConfig = {
  configureMainDeviceDetectionPortPair(detectionPortPair) {
    detectionPortPair.expectInputNameEquals("X-Touch").expectOutputNameEquals("X-Touch");
  },

  createExtenderSurface(surface, x) {
    const surfaceWidth = channelElementsWidth + 1;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    return {
      width: surfaceWidth,
      channelElements: makeChannelElements(surface, x),
    };
  },

  createMainSurface(surface, x) {
    const surfaceWidth = channelElementsWidth + 25.5;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    const channelElements = makeChannelElements(surface, x);
    x += channelElementsWidth;

    surface.makeBlindPanel(x + 1, 6, 23.25, 4); // Time display

    const miscControlButtons = createElements(21, (index) =>
      makeSquareButton(
        surface,
        x + 6 + (index % 7) * 2.625,
        17 + Math.floor(index / 7) * 2.5 + (index < 14 ? 0 : 0.5)
      )
    );
    const getMiscControlButtons = (indices: number[]) =>
      indices.map((index) => miscControlButtons[index]);

    return {
      width: surfaceWidth,
      channelElements,
      controlSectionElements: {
        mainFader: surface.makeTouchSensitiveFader(x + 2, 20, 2, 16),

        jogWheel: surface.makeJogWheel(x + 13, 29.25, 8.5, 8.5),

        buttons: {
          display: makeSquareButton(surface, x + 2, 7.25),
          timeMode: makeSquareButton(surface, x + 21.75, 7.25),
          edit: surface.makeLedButton(x + 2, 10.5, 2, 1.5),
          flip: surface.makeLedButton(x + 2, 16, 2, 1.5),
          scrub: makeSquareButton(surface, x + 21.75, 28),

          encoderAssign: createElements(6, (index) =>
            makeSquareButton(surface, x + 2 + index * 2.25, 3.5)
          ),
          number: createElements(8, (index) =>
            makeSquareButton(surface, x + 6 + index * 2.25, 10.5)
          ),
          function: createElements(8, (index) =>
            makeSquareButton(surface, x + 6 + index * 2.25, 14)
          ),
          modify: getMiscControlButtons([0, 1, 7, 8]),
          automation: getMiscControlButtons([2, 3, 4, 9, 10, 11]),
          utility: getMiscControlButtons([5, 6, 12, 13]),
          transport: [
            ...miscControlButtons.slice(14),
            ...createElements(5, (index) =>
              surface.makeLedButton(x + 6.25 + index * 3.56, 25, 3, 2)
            ),
          ],

          navigation: {
            bank: {
              left: makeSquareButton(surface, x + 6.75, 28),
              right: makeSquareButton(surface, x + 9.25, 28),
            },
            channel: {
              left: makeSquareButton(surface, x + 6.75, 30),
              right: makeSquareButton(surface, x + 9.25, 30),
            },
            directions: {
              left: makeSquareButton(surface, x + 6.25, 34),
              right: makeSquareButton(surface, x + 9.75, 34),
              up: makeSquareButton(surface, x + 8, 32.25),
              center: makeSquareButton(surface, x + 8, 34),
              down: makeSquareButton(surface, x + 8, 35.75),
            },
          },
        },

        displayLeds: {
          smpte: surface.makeDecoratedLamp(x + 21.25, 6.5, 0.75, 0.5),
          beats: surface.makeDecoratedLamp(x + 21.25, 9, 0.75, 0.5),
          solo: surface.makeDecoratedLamp(x + 7.75, 7.75, 0.75, 0.5),
        },

        expressionPedal: surface.makeKnob(x + 18, 3.5, 1.5, 1.9),
        footSwitches: createElements(2, (index) =>
          surface.makeButton(x + 20 + index * 2, 3.5, 1.5, 1.5).setShapeCircle()
        ),
      },
    };
  },
};
