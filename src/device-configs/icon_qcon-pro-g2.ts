/**
 * @vendor iCON
 * @device QCon Pro G2
 */

import { ChannelSurfaceElements, DeviceConfig } from ".";
import { JogWheel } from "/decorators/surface-elements/JogWheel";
import { Lamp } from "/decorators/surface-elements/Lamp";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { TouchSensitiveMotorFader } from "/decorators/surface-elements/TouchSensitiveFader";
import { createElements } from "/util";

const channelWidth = 3.75;
const channelElementsWidth = 4 + 8 * channelWidth;
const surfaceHeight = 39.5;

const buttonRowHeight = 2.35;
const buttonDistance = 2.55;

function makeSquareButton(
  surface: MR_DeviceSurface,
  x: number,
  y: number,
  isChannelButton = false,
) {
  return new LedButton(surface, { position: [x, y, 1.8, 1.5], isChannelButton });
}

function makeChannelElements(surface: MR_DeviceSurface, x: number): ChannelSurfaceElements[] {
  return createElements(8, (index) => {
    const currentChannelXPosition = x + index * channelWidth;

    const encoder = new LedPushEncoder(surface, 3.1 + currentChannelXPosition, 8.8, 3.6, 3.6);
    surface.makeLabelField(3.1 + currentChannelXPosition, 3, 3.75, 2).relateTo(encoder);

    return {
      index,
      encoder,
      scribbleStrip: {
        trackTitle: surface.makeCustomValueVariable("scribbleStripTrackTitle"),
      },
      vuMeter: surface.makeCustomValueVariable("vuMeter"),
      buttons: {
        record: makeSquareButton(surface, 4 + currentChannelXPosition, 13, true),
        solo: makeSquareButton(surface, 4 + currentChannelXPosition, 13 + buttonRowHeight, true),
        mute: makeSquareButton(
          surface,
          4 + currentChannelXPosition,
          13 + buttonRowHeight * 2,
          true,
        ),
        select: makeSquareButton(
          surface,
          4 + currentChannelXPosition,
          13 + buttonRowHeight * 3,
          true,
        ),
      },

      fader: new TouchSensitiveMotorFader(surface, 4 + currentChannelXPosition, 24.4, 1.8, 12),
    };
  });
}

export const deviceConfig: DeviceConfig = {
  detectionUnits: [
    {
      main: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameContains("iCON QCON Pro G2")
          .expectOutputNameContains("iCON QCON Pro G2"),
      extender: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameContains("iCON QCON EX1 G2")
          .expectOutputNameContains("iCON QCON EX1 G2"),
    },
  ],

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
      makeSquareButton(surface, x + 3.5 + (index + 1) * buttonDistance, 13 - buttonRowHeight * 2),
    );

    const lowerControlButtons = createElements(12, (index) =>
      makeSquareButton(
        surface,
        x + 3.5 + (index % 6) * buttonDistance,
        23.5 + buttonRowHeight * Math.floor(index / 6),
      ),
    );

    const automationButtons = createElements(6, (index) =>
      makeSquareButton(surface, x + 3.5 + index * buttonDistance, 13 + buttonRowHeight * 3),
    );

    const layer2FunctionButtons = createElements(
      8,
      (index) =>
        new LedButton(surface, {
          position: [
            x + 3.5 + ((index % 4) + 2) * buttonDistance,
            13 + buttonRowHeight * (Math.floor(index / 4) + 0.5) - 0.9,
            1.8,
            0.75,
          ],
        }),
    );

    const markerButtons = createElements(
      3,
      (index) =>
        new LedButton(surface, {
          position: [x + 3.5 + index * buttonDistance, 23.5 + buttonRowHeight * 2 - 0.5, 1.8, 0.75],
        }),
    );

    return {
      width: surfaceWidth,
      channelElements,
      controlSectionElements: {
        mainFader: new TouchSensitiveMotorFader(surface, x, 24.4, 1.8, 12),

        jogWheel: new JogWheel(surface, x + 12.75, 30, 6, 6),

        buttons: {
          display: upperControlButtons[0],
          timeMode: upperControlButtons[1],
          edit: layer2FunctionButtons[7],
          flip: makeSquareButton(surface, x, 13 - buttonRowHeight),
          scrub: makeSquareButton(surface, x + 11.2, 28.75),

          encoderAssign: createElements(6, (index) =>
            makeSquareButton(surface, x + 3.5 + index * buttonDistance, 13 + buttonRowHeight * 2),
          ),
          number: layer2FunctionButtons.slice(0, 7).concat(new LedButton(surface)),
          function: createElements(8, (index) =>
            makeSquareButton(
              surface,
              x + 3.5 + ((index % 4) + 2) * buttonDistance,
              13 + buttonRowHeight * (Math.floor(index / 4) - 0.5),
            ),
          ),
          modify: {
            undo: upperControlButtons[2],
            redo: upperControlButtons[3],
            save: upperControlButtons[4],
          },
          automation: {
            read: automationButtons[0],
            write: automationButtons[1],
            sends: automationButtons[2],
            project: automationButtons[3],
            mixer: automationButtons[4],
            motor: automationButtons[5],
          },
          utility: {
            instrument: lowerControlButtons[0],
            main: lowerControlButtons[1],
            soloDefeat: lowerControlButtons[8],
            shift: lowerControlButtons[2],
          },
          transport: {
            left: lowerControlButtons[6],
            right: lowerControlButtons[7],
            cycle: lowerControlButtons[4],

            markers: {
              previous: markerButtons[0],
              add: markerButtons[1],
              next: markerButtons[2],
            },

            rewind: lowerControlButtons[3],
            forward: lowerControlButtons[5],
            stop: lowerControlButtons[11],
            play: lowerControlButtons[10],
            record: lowerControlButtons[9],
          },

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
          smpte: new Lamp(surface, { position: [x + 5.25, 3.25, 0.75, 0.5] }),
          beats: new Lamp(surface, { position: [x + 5.25, 4.25, 0.75, 0.5] }),
          solo: new Lamp(surface, { position: [x + 18, 3.75, 0.75, 0.5] }),
        },

        footSwitches: createElements(2, (index) =>
          surface.makeButton(x + 6 + index * 2, 0.875, 1.5, 1.5).setShapeCircle(),
        ),
      },
    };
  },
};
