/**
 * @vendor iCON
 * @device QCon Pro G2
 */

import { createElements } from "../util";
import { ChannelSurfaceElements, DeviceConfig } from ".";
import { DecoratedDeviceSurface } from "../decorators/surface";

const channelWidth = 3.75;
const channelElementsWidth = 4 + 8 * channelWidth;
const surfaceHeight = 39.5;

const buttonRowHeight = 2.35;
const buttonDistance = 2.55;

function makeSquareButton(surface: DecoratedDeviceSurface, x: number, y: number) {
  return surface.makeLedButton(x, y, 1.8, 1.5);
}

function makeChannelElements(surface: DecoratedDeviceSurface, x: number): ChannelSurfaceElements[] {
  return createElements(8, (index) => {
    const currentChannelXPosition = x + index * channelWidth;
    const encoder = surface.makeLedPushEncoder(3.1 + currentChannelXPosition, 8.8, 3.6, 3.6);

    return {
      index,
      encoder,
      scribbleStrip: {
        encoderLabel: surface
          .makeLabelField(3.1 + currentChannelXPosition, 3, 3.75, 2)
          .relateTo(encoder),
        trackTitle: surface.makeCustomValueVariable("scribbleStripTrackTitle"),
      },
      vuMeter: surface.makeCustomValueVariable("vuMeter"),
      buttons: {
        record: makeSquareButton(surface, 4 + currentChannelXPosition, 13),
        solo: makeSquareButton(surface, 4 + currentChannelXPosition, 13 + buttonRowHeight),
        mute: makeSquareButton(surface, 4 + currentChannelXPosition, 13 + buttonRowHeight * 2),
        select: makeSquareButton(surface, 4 + currentChannelXPosition, 13 + buttonRowHeight * 3),
      },

      fader: surface.makeTouchSensitiveFader(4 + currentChannelXPosition, 24.4, 1.8, 12),
    };
  });
}

export const deviceConfig: DeviceConfig = {
  configureMainDeviceDetectionPortPair(detectionPortPair) {
    detectionPortPair
      .expectInputNameContains("iCON QCON Pro G2")
      .expectOutputNameContains("iCON QCON Pro G2");
  },

  createExtenderSurface(surface, x) {
    const surfaceWidth = channelElementsWidth + 3.1;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    // Display bar
    surface.makeBlindPanel(x + 1.5, 1.5, surfaceWidth - 3, 5);

    return {
      width: surfaceWidth,
      channelElements: makeChannelElements(surface, x),
    };
  },

  createMainSurface(surface, x) {
    const surfaceWidth = channelElementsWidth + 20;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    // Display bar
    surface.makeBlindPanel(x + 1.5, 1.5, channelElementsWidth + 17.5, 5);

    const channelElements = makeChannelElements(surface, x);
    x += channelElementsWidth;

    surface.makeBlindPanel(x + 6, 3, 12, 2); // Time display

    const upperControlButtons = createElements(5, (index) =>
      makeSquareButton(surface, x + 3.5 + (index + 1) * buttonDistance, 13 - buttonRowHeight * 2)
    );

    const lowerControlButtons = createElements(12, (index) =>
      makeSquareButton(
        surface,
        x + 3.5 + (index % 6) * buttonDistance,
        23.5 + buttonRowHeight * Math.floor(index / 6)
      )
    );
    const getLowerControlButtons = (indices: number[]) =>
      indices.map((index) => lowerControlButtons[index]);

    return {
      width: surfaceWidth,
      channelElements,
      controlSectionElements: {
        mainFader: surface.makeTouchSensitiveFader(x, 24.4, 1.8, 12),

        jogWheel: surface.makeJogWheel(x + 12.75, 30, 6, 6),

        buttons: {
          display: upperControlButtons[0],
          timeMode: upperControlButtons[1],
          edit: surface.makeLedButton(
            x + 3.5 + 5 * buttonDistance,
            13 + buttonRowHeight * 1.5 - 0.5,
            1.8,
            0.75
          ),
          flip: makeSquareButton(surface, x, 13 - buttonRowHeight),
          scrub: makeSquareButton(surface, x + 11.2, 28.75),

          encoderAssign: createElements(6, (index) =>
            makeSquareButton(surface, x + 3.5 + index * buttonDistance, 13 + buttonRowHeight * 2)
          ),
          number: surface.makeHiddenLedButtons(8),
          function: createElements(8, (index) =>
            makeSquareButton(
              surface,
              x + 3.5 + ((index % 4) + 2) * buttonDistance,
              13 + buttonRowHeight * (Math.floor(index / 4) - 0.5)
            )
          ),
          modify: [...upperControlButtons.slice(2, 5), surface.makeHiddenLedButton()],
          automation: createElements(6, (index) =>
            makeSquareButton(surface, x + 3.5 + index * buttonDistance, 13 + buttonRowHeight * 3)
          ),
          utility: [
            ...lowerControlButtons.slice(0, 2),
            lowerControlButtons[8],
            lowerControlButtons[2],
          ],
          transport: [
            ...getLowerControlButtons([6, 7, 4]),
            surface.makeHiddenLedButton(), //Cycle
            ...createElements(3, (index) =>
              surface.makeLedButton(
                x + 3.5 + index * buttonDistance,
                23.5 + buttonRowHeight * 2 - 0.5,
                1.8,
                0.75
              )
            ),
            ...getLowerControlButtons([3, 5, 11, 10, 9]),
          ],

          navigation: {
            channel: {
              left: makeSquareButton(surface, x, 13),
              right: makeSquareButton(surface, x, 13 + buttonRowHeight),
            },
            bank: {
              left: makeSquareButton(surface, x, 13 + buttonRowHeight * 2),
              right: makeSquareButton(surface, x, 13 + buttonRowHeight * 3),
            },

            directions: {
              left: makeSquareButton(surface, x + 4.75, 31.8),
              right: makeSquareButton(surface, x + 9.75, 31.8),
              up: makeSquareButton(surface, x + 7.25, 29.5),
              center: makeSquareButton(surface, x + 7.25, 31.8),
              down: makeSquareButton(surface, x + 7.25, 34.1),
            },
          },
        },

        displayLeds: {
          smpte: surface.makeDecoratedLamp(x + 5.25, 3.25, 0.75, 0.5),
          beats: surface.makeDecoratedLamp(x + 5.25, 4.25, 0.75, 0.5),
          solo: surface.makeDecoratedLamp(x + 18, 3.75, 0.75, 0.5),
        },

        expressionPedal: {
          mSurfaceValue: surface.makeCustomValueVariable("ExpressionPedal"),
        } as MR_Knob,
        footSwitches: createElements(2, (index) =>
          surface.makeButton(x + 6 + index * 2, 0.875, 1.5, 1.5).setShapeCircle()
        ),
      },
    };
  },
};
