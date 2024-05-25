/**
 * @vendor Behringer
 * @device X-Touch One
 */

import { DeviceConfig } from ".";
import { JogWheel } from "/decorators/surface-elements/JogWheel";
import { Lamp } from "/decorators/surface-elements/Lamp";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { TouchSensitiveMotorFader } from "/decorators/surface-elements/TouchSensitiveFader";
import * as encoderPageConfigs from "/mapping/encoders/page-configs";
import { createElements } from "/util";

export const deviceConfig: DeviceConfig = {
  channelColorSupport: "behringer",
  hasIndividualScribbleStrips: true,
  shallMouseValueModeMapAllEncoders: true,
  detectionUnits: [
    {
      main: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameEquals("X-Touch One")
          .expectOutputNameEquals("X-Touch One"),
      extender: () => {},
    },
  ],

  createMainSurface(surface, x) {
    const makeSquareButton = (x: number, y: number, isChannelButton = false) =>
      new LedButton(surface, { position: [x + 0.25, y, 1.5, 1.5], isChannelButton });

    const getGridButtonPosition = (column: number, row: number): [number, number] => {
      return [x + 7.75 + column * 2.975, 9 + row * 3.75];
    };

    const surfaceWidth = 28.75;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, 36);

    const channelsControlLayerZone = surface.makeControlLayerZone("Channels");

    // Time display
    surface.makeBlindPanel(x + 7, 3.4, 21.1, 4.5);

    // Scribble strip
    surface.makeBlindPanel(x + 1.6, 8.25, 3.6, 2.75);

    // Channel meter
    surface.makeBlindPanel(x + 5.825, 16.5, 0.65, 8);

    // Main button
    const mainButtonPosition = getGridButtonPosition(2, 0);
    surface.makeBlindPanel(mainButtonPosition[0] + 0.25, mainButtonPosition[1], 1.5, 1.5);

    const channelElements = createElements(8, (index) => {
      const channelLayer = channelsControlLayerZone.makeControlLayer(`Channel ${index + 1}`);

      return {
        index,
        encoder: new LedPushEncoder(surface, x + 1.5, 4, 4, 4).setControlLayer(channelLayer),
        scribbleStrip: {
          trackTitle: surface.makeCustomValueVariable("scribbleStripTrackTitle"),
        },
        vuMeter: surface.makeCustomValueVariable("vuMeter"),
        buttons: {
          record: makeSquareButton(...getGridButtonPosition(6, 0), true).setControlLayer(
            channelLayer,
          ),
          solo: makeSquareButton(...getGridButtonPosition(5, 0), true).setControlLayer(
            channelLayer,
          ),
          mute: makeSquareButton(...getGridButtonPosition(4, 0), true).setControlLayer(
            channelLayer,
          ),
          select: makeSquareButton(...getGridButtonPosition(3, 0), true).setControlLayer(
            channelLayer,
          ),
        },

        fader: new TouchSensitiveMotorFader(surface, x + 2.5, 15.8, 2, 17.15).setControlLayer(
          channelLayer,
        ),
      };
    });

    const mainChannelControlLayer = channelsControlLayerZone.makeControlLayer("Main");

    const upperTransportButtons = createElements(5, (index) =>
      makeSquareButton(...getGridButtonPosition(2 + index, 2)),
    );
    const lowerTransportButtons = createElements(
      5,
      (index) => new LedButton(surface, { position: [x + 8 + index * 4.0625, 19.5, 3.1, 2.1] }),
    );

    return {
      width: surfaceWidth,
      channelElements,
      controlSectionElements: {
        mainFader: new TouchSensitiveMotorFader(surface, x + 2.5, 15.8, 2, 17.15).setControlLayer(
          mainChannelControlLayer,
        ),

        jogWheel: new JogWheel(surface, x + 14.9 + 1.75, 25.2, 9, 9),

        buttons: {
          timeMode: makeSquareButton(...getGridButtonPosition(1, 0)),
          scrub: makeSquareButton(x + 23.85 + 1.75, 22.75),

          function: createElements(4, (index) =>
            makeSquareButton(...getGridButtonPosition(1 + index, 1)),
          ).concat(createElements(4, () => new LedButton(surface))),

          modify: {
            undo: makeSquareButton(...getGridButtonPosition(0, 2)),
            redo: makeSquareButton(...getGridButtonPosition(1, 2)),
          },
          automation: {
            read: makeSquareButton(...getGridButtonPosition(5, 1)),
            write: makeSquareButton(...getGridButtonPosition(6, 1)),
          },
          transport: {
            cycle: upperTransportButtons[0],
            punch: upperTransportButtons[1],
            markers: {
              previous: upperTransportButtons[2],
              add: upperTransportButtons[3],
              next: upperTransportButtons[4],
            },

            rewind: lowerTransportButtons[0],
            forward: lowerTransportButtons[1],
            stop: lowerTransportButtons[2],
            play: lowerTransportButtons[3],
            record: lowerTransportButtons[4],
          },

          navigation: {
            bank: {
              left: makeSquareButton(x + 8.75, 22.8),
              right: makeSquareButton(x + 11.55, 22.8),
            },
            channel: {
              left: makeSquareButton(x + 8.75, 25.4),
              right: makeSquareButton(x + 11.55, 25.4),
            },
            directions: {
              left: makeSquareButton(x + 7.95, 30.6),
              right: makeSquareButton(x + 12.35, 30.6),
              up: makeSquareButton(x + 10.15, 28.3),
              center: makeSquareButton(x + 10.15, 30.6),
              down: makeSquareButton(x + 10.15, 32.8),
            },
          },
        },

        displayLeds: {
          solo: new Lamp(surface, { position: [x + 11.75, 5.4, 0.75, 0.5] }),
        },

        footSwitch1: surface.makeButton(x + 11.375, 0.5, 1.5, 1.5).setShapeCircle(),
      },
    };
  },

  getSupplementaryShiftButtons(device) {
    return [device.controlSectionElements.buttons.function[3]];
  },

  getMouseValueModeButton(device) {
    return device.controlSectionElements.buttons.function[2];
  },

  configureEncoderMappings() {
    return [
      // Pan, Monitor, Gain, LC, HC, Sends 1-3 (F1)
      {
        activatorButtonSelector: (device) => device.controlSectionElements.buttons.function[0],
        pages: [
          encoderPageConfigs.pan,
          encoderPageConfigs.monitor,
          encoderPageConfigs.inputGain,
          encoderPageConfigs.lowCut,
          encoderPageConfigs.highCut,
          encoderPageConfigs.sendSlot(0),
          encoderPageConfigs.sendSlot(1),
          encoderPageConfigs.sendSlot(2),
        ],
      },
    ];
  },
};
