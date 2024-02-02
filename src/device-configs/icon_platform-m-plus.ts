/**
 * @vendor iCON
 * @device Platform M Plus
 */

import { ChannelSurfaceElements, DeviceConfig } from ".";
import { JogWheel } from "/decorators/surface-elements/JogWheel";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { TouchSensitiveMotorFader } from "/decorators/surface-elements/TouchSensitiveFader";
import { createElements, getArrayElements } from "/util";

const channelWidth = 5;
const channelElementsWidth = 2 + 8 * channelWidth;
const surfaceHeight = 34.6;

const buttonRowHeight = 2.35;
const buttonDistance = 2.4;

function makeSquareButton(
  surface: MR_DeviceSurface,
  x: number,
  y: number,
  isChannelButton = false,
) {
  return new LedButton(surface, { position: [x, y, 1.7, 1.7], isChannelButton });
}

function makeChannelElements(surface: MR_DeviceSurface, x: number): ChannelSurfaceElements[] {
  return createElements(8, (index) => {
    const currentChannelXPosition = x + index * channelWidth;

    const encoder = new LedPushEncoder(surface, 2 + currentChannelXPosition - 0.15, 9, 2.3, 2.3);
    const buttons = createElements(4, (index) =>
      makeSquareButton(
        surface,
        4.75 + currentChannelXPosition,
        21 + buttonRowHeight * index - +(index === 3) * 0.3,
        true,
      ),
    );
    buttons[3].setShapeCircle();

    surface.makeLabelField(2.5 + currentChannelXPosition, 3, channelWidth, 1).relateTo(encoder);
    surface.makeLabelField(2.5 + currentChannelXPosition, 4, channelWidth, 1).relateTo(buttons[0]);

    return {
      index,
      encoder,
      scribbleStrip: {
        trackTitle: surface.makeCustomValueVariable("scribbleStripTrackTitle"),
      },
      vuMeter: surface.makeCustomValueVariable("vuMeter"),
      buttons: { select: buttons[0], mute: buttons[1], solo: buttons[2], record: buttons[3] },
      fader: new TouchSensitiveMotorFader(surface, 2 + currentChannelXPosition, 14, 2, 15.55),
    };
  });
}

export const deviceConfig: DeviceConfig = {
  detectionUnits: [
    {
      main: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameContains("Platform M")
          .expectOutputNameContains("Platform M"),
      extender: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameContains("Platform X")
          .expectOutputNameContains("Platform X"),
    },
  ],

  createExtenderSurface(surface, x) {
    const surfaceWidth = channelElementsWidth + 3;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    // Display bar
    surface.makeBlindPanel(x + 2, 2.5, channelElementsWidth - 1, 3);

    return {
      width: surfaceWidth,
      channelElements: makeChannelElements(surface, x),
    };
  },

  createMainSurface(surface, x) {
    function makeHiddenButtons(buttonCount: number) {
      return createElements(buttonCount, () => new LedButton(surface));
    }

    const surfaceWidth = channelElementsWidth + 12;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    // Display bar
    surface.makeBlindPanel(x + 2, 2.5, channelElementsWidth - 1, 3);

    const channelElements = makeChannelElements(surface, x);
    x += channelElementsWidth;

    const controlButtonArray = createElements(10, (index) =>
      makeSquareButton(
        surface,
        x + 5.1 + (index % 2) * buttonDistance,
        12.6 + 2.5 * Math.floor(index / 2) + +(index > 3) * 0.5,
      ),
    );

    // Zoom buttons (not available via MIDI)
    surface.makeBlindPanel(x + 5.1, 25.5, 1.7, 1.7).setShapeCircle();
    surface.makeBlindPanel(x + 5.1 + buttonDistance, 25.6, 1.7, 1.7).setShapeCircle();

    const mainChannelButtons = [
      ...createElements(3, (index) =>
        makeSquareButton(surface, x + 2.75, 21 + buttonRowHeight * index),
      ),
    ];

    // Lock button (not available via MIDI)
    surface.makeBlindPanel(x + 2.75, 21 + buttonRowHeight * 3 - 0.3, 1.7, 1.7).setShapeCircle();

    return {
      width: surfaceWidth,
      channelElements,
      controlSectionElements: {
        mainFader: new TouchSensitiveMotorFader(surface, x, 14, 2, 15.55),

        jogWheel: new JogWheel(surface, x + 4.15, 27.4, 6, 6),

        buttons: {
          display: new LedButton(surface),
          timeMode: new LedButton(surface),
          edit: new LedButton(surface),
          flip: new LedButton(surface),
          scrub: new LedButton(surface),

          encoderAssign: makeHiddenButtons(6),
          number: makeHiddenButtons(8),
          function: makeHiddenButtons(8),
          modify: makeHiddenButtons(4),
          automation: [
            mainChannelButtons[1],
            mainChannelButtons[2],
            ...makeHiddenButtons(2),
            mainChannelButtons[0],
            new LedButton(surface),
          ],
          utility: makeHiddenButtons(4),
          transport: [
            ...makeHiddenButtons(2),
            controlButtonArray[9],
            ...makeHiddenButtons(4),
            ...getArrayElements(controlButtonArray, [4, 5, 7, 6, 8]),
          ],

          navigation: {
            channel: {
              left: controlButtonArray[0],
              right: controlButtonArray[1],
            },
            bank: {
              left: controlButtonArray[2],
              right: controlButtonArray[3],
            },

            directions: {
              left: new LedButton(surface),
              right: new LedButton(surface),
              up: new LedButton(surface),
              center: new LedButton(surface),
              down: new LedButton(surface),
            },
          },
        },

        expressionPedal: {
          mSurfaceValue: surface.makeCustomValueVariable("ExpressionPedal"),
        } as MR_Knob,
        footSwitches: [
          {
            mSurfaceValue: surface.makeCustomValueVariable("FootSwitch1"),
          } as MR_Button,
          {
            mSurfaceValue: surface.makeCustomValueVariable("FootSwitch2"),
          } as MR_Button,
        ],
      },
    };
  },
};
