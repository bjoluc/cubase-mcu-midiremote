/**
 * @vendor Behringer
 * @device X-Touch
 */

import { ChannelSurfaceElements, DeviceConfig } from ".";
import { JogWheel } from "/decorators/surface-elements/JogWheel";
import { Lamp } from "/decorators/surface-elements/Lamp";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { TouchSensitiveMotorFader } from "/decorators/surface-elements/TouchSensitiveFader";
import { BehringerColorManager } from "/midi/managers/colors/BehringerColorManager";
import { createElements } from "/util";

const channelWidth = 5;
const channelElementsWidth = 8 * channelWidth;
const surfaceHeight = 45;

function makeSquareButton(
  surface: MR_DeviceSurface,
  x: number,
  y: number,
  isChannelButton = false,
) {
  return new LedButton(surface, { position: [x + 0.25, y, 1.5, 1.5], isChannelButton });
}

function makeChannelElements(surface: MR_DeviceSurface, x: number): ChannelSurfaceElements[] {
  return createElements(8, (index) => {
    const currentChannelXPosition = x + index * channelWidth;
    const encoder = new LedPushEncoder(surface, currentChannelXPosition + 1, 3, 4, 4);
    const selectButton = new LedButton(surface, {
      position: [2 + currentChannelXPosition + 0.8, 18, 2, 1.5],
      isChannelButton: true,
    });

    // Channel meter
    surface.makeBlindPanel(currentChannelXPosition + 1.2, 11.5, 0.65, 8);

    // Scribble strip
    surface.makeBlindPanel(currentChannelXPosition + 1.2, 7.25, 3.6, 2.75);
    surface.makeLabelField(currentChannelXPosition + 1.4, 7.45, 3.2, 1.175).relateTo(encoder);
    surface
      .makeLabelField(currentChannelXPosition + 1.4, 7.45 + 1.175, 3.2, 1.175)
      .relateTo(selectButton);

    return {
      index,
      encoder,
      scribbleStrip: {
        trackTitle: surface.makeCustomValueVariable("scribbleStripTrackTitle"),
      },
      vuMeter: surface.makeCustomValueVariable("vuMeter"),
      buttons: {
        record: new LedButton(surface, {
          position: [currentChannelXPosition + 2.25 + 0.8, 11.5, 1.5, 1.25],
          isChannelButton: true,
        }),
        solo: makeSquareButton(surface, 2 + currentChannelXPosition + 0.8, 13.5, true),
        mute: makeSquareButton(surface, 2 + currentChannelXPosition + 0.8, 15.75, true),
        select: selectButton,
      },

      fader: new TouchSensitiveMotorFader(surface, 2 + currentChannelXPosition, 24.1, 2, 17.15),
    };
  });
}

const extenderPortPairConfigurator = (
  detectionPortPair: MR_DetectionPortPair,
  extenderNumber: number,
) => {
  let name = "X-Touch-Ext";
  if (extenderNumber > 1) {
    name += extenderNumber;
  }

  detectionPortPair.expectInputNameEquals(name).expectOutputNameEquals(name);
};

export const deviceConfig: DeviceConfig = {
  colorManager: BehringerColorManager,
  hasIndividualScribbleStrips: true,
  detectionUnits: [
    {
      main: (detectionPortPair) =>
        detectionPortPair.expectInputNameEquals("X-Touch").expectOutputNameEquals("X-Touch"),
      extender: extenderPortPairConfigurator,
    },
    {
      main: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameEquals("X-Touch INT")
          .expectOutputNameEquals("X-Touch INT"),
      extender: extenderPortPairConfigurator,
    },
  ],

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
    const surfaceWidth = channelElementsWidth + 26.75;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    const channelElements = makeChannelElements(surface, x);
    x += channelElementsWidth;

    const encoderAssignButtons = createElements(6, (index) =>
      makeSquareButton(surface, x + 2 + index * 2.55, 3.5),
    );

    surface.makeBlindPanel(x + 1, 6.4, 25.1, 4.5); // Time display

    const miscControlButtons = createElements(21, (index) =>
      makeSquareButton(
        surface,
        x + 6 + (index % 7) * 2.975,
        19.25 + Math.floor(index / 7) * 2.5 + (index < 14 ? 0 : 1.25),
      ),
    );

    const transportButtons = createElements(
      5,
      (index) => new LedButton(surface, { position: [x + 6.25 + index * 4.0625, 28.5, 3.1, 2.1] }),
    );

    return {
      width: surfaceWidth,
      channelElements,
      controlSectionElements: {
        mainFader: new TouchSensitiveMotorFader(surface, x + 2, 24.1, 2, 17.15),

        jogWheel: new JogWheel(surface, x + 14.9, 34.2, 9, 9),

        buttons: {
          display: makeSquareButton(surface, x + 2, 7.9),
          timeMode: makeSquareButton(surface, x + 23.85, 7.9),
          edit: new LedButton(surface, { position: [x + 2, 11.75, 2, 1.5] }),
          flip: new LedButton(surface, { position: [x + 2, 18, 2, 1.5] }),
          scrub: makeSquareButton(surface, x + 23.85, 31.75),

          encoderAssign: {
            track: encoderAssignButtons[0],
            pan: encoderAssignButtons[1],
            eq: encoderAssignButtons[2],
            send: encoderAssignButtons[3],
            plugin: encoderAssignButtons[4],
            instrument: encoderAssignButtons[5],
          },

          number: createElements(8, (index) =>
            makeSquareButton(surface, x + 6 + index * 2.55, 11.75),
          ),
          function: createElements(8, (index) =>
            makeSquareButton(surface, x + 6 + index * 2.55, 15.75),
          ),

          modify: {
            undo: miscControlButtons[0],
            redo: miscControlButtons[1],
            save: miscControlButtons[7],
            revert: miscControlButtons[8],
          },
          automation: {
            read: miscControlButtons[2],
            write: miscControlButtons[3],
            sends: miscControlButtons[4],
            project: miscControlButtons[9],
            mixer: miscControlButtons[10],
            motor: miscControlButtons[11],
          },
          utility: {
            instrument: miscControlButtons[5],
            main: miscControlButtons[6],
            soloDefeat: miscControlButtons[12],
            shift: miscControlButtons[13],
          },
          transport: {
            left: miscControlButtons[14],
            right: miscControlButtons[15],
            cycle: miscControlButtons[16],
            punch: miscControlButtons[17],

            markers: {
              previous: miscControlButtons[18],
              add: miscControlButtons[19],
              next: miscControlButtons[20],
            },

            rewind: transportButtons[0],
            forward: transportButtons[1],
            stop: transportButtons[2],
            play: transportButtons[3],
            record: transportButtons[4],
          },

          navigation: {
            bank: {
              left: makeSquareButton(surface, x + 7, 31.8),
              right: makeSquareButton(surface, x + 9.8, 31.8),
            },
            channel: {
              left: makeSquareButton(surface, x + 7, 34.4),
              right: makeSquareButton(surface, x + 9.8, 34.4),
            },
            directions: {
              left: makeSquareButton(surface, x + 6.2, 39.6),
              right: makeSquareButton(surface, x + 10.6, 39.6),
              up: makeSquareButton(surface, x + 8.4, 37.3),
              center: makeSquareButton(surface, x + 8.4, 39.6),
              down: makeSquareButton(surface, x + 8.4, 41.8),
            },
          },
        },

        displayLeds: {
          smpte: new Lamp(surface, { position: [x + 23.25, 6.9, 0.75, 0.5] }),
          beats: new Lamp(surface, { position: [x + 23.25, 9.9, 0.75, 0.5] }),
          solo: new Lamp(surface, { position: [x + 8, 8.4, 0.75, 0.5] }),
        },

        expressionPedal: surface.makeKnob(x + 20.1, 3.5, 1.5, 1.9),
        footSwitch1: surface.makeButton(x + 22.1, 3.5, 1.5, 1.5).setShapeCircle(),
        footSwitch2: surface.makeButton(x + 22.1 + 2, 3.5, 1.5, 1.5).setShapeCircle(),
      },
    };
  },
};
