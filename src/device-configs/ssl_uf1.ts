/**
 * @vendor SSL
 * @device UF1
 */

import { DeviceConfig } from ".";
import { JogWheel } from "/decorators/surface-elements/JogWheel";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { TouchSensitiveMotorFader } from "/decorators/surface-elements/TouchSensitiveFader";
import { focusedQuickControls as makeFocusedQuickControlsEncoderPageConfig } from "/mapping/encoders/page-configs";
import { createElements } from "/util";

export const deviceConfig: DeviceConfig = {
  hasIndividualScribbleStrips: true,
  detectionUnits: [
    {
      main: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameEquals("SSL V-MIDI Port 1 Source")
          .expectOutputNameEquals("SSL V-MIDI Port 1 Destination"),
      extender: () => {},
    },
  ],

  createMainSurface(surface, x) {
    const makeSquareButton = (x: number, y: number, isChannelButton = false) =>
      new LedButton(surface, { position: [x, y, 1.1, 1.1], isChannelButton });

    const makeBlindButton = (x: number, y: number) => {
      surface.makeBlindPanel(x, y, 1.1, 1.1);
    };

    const getSquareButtonX = (column: number) => 8.05 + column * 1.75;

    const surfaceWidth = 22;

    surface.makeBlindPanel(x, 0, surfaceWidth, 28.5); // Device frame
    surface.makeBlindPanel(x + 8.65, 2.8, 10.85, 6.5); // Time display
    surface.makeBlindPanel(x + 9.1, 12.8, 2.5, 2.5).setShapeCircle(); // Channel selection encoder
    surface.makeBlindPanel(x + 8.55, 17.65, 3.6, 3.6).setShapeCircle(); // Arrow buttons circle
    surface.makeBlindPanel(x + 2, 0.4, 5, 26.2); // Channel frame
    surface.makeBlindPanel(x + 2.75, 3.2, 3.5, 4.2); // Scribble strip
    surface.makeBlindPanel(x + 3.75, 8.6, 1.5, 1.5).setShapeCircle(); // Channel encoder
    makeBlindButton(x + 2.5, 23); // Channel main button

    const softKeyControlLayerZone = surface.makeControlLayerZone("Soft Keys");
    const softKeys = createElements(10, (layerIndex) => {
      const controlLayer = softKeyControlLayerZone.makeControlLayer(
        `Soft Key Page ${layerIndex + 1}`,
      );

      return createElements(4, (index) =>
        new LedButton(surface, { position: [x + 8.9 + index * 3, 1.2, 1.35, 0.8] }).setControlLayer(
          controlLayer,
        ),
      );
    });

    const channelSoftKey = new LedButton(surface, {
      position: [x + 2 + (5 - 1.35) / 2, 1.2, 1.35, 0.8],
    });

    const getUpperButtonArrayPosition = (buttonIndex: number): [number, number] => [
      getSquareButtonX(3 + (buttonIndex % 4)),
      12.35 + Math.floor(buttonIndex / 4) * 1.75,
    ];
    [0, 1, 2, 3, 6].map((buttonIndex) =>
      makeBlindButton(...getUpperButtonArrayPosition(buttonIndex)),
    );

    const transportShiftControlLayerZone = surface.makeControlLayerZone("Shift");
    const defaultTransportControlLayer = transportShiftControlLayerZone.makeControlLayer("Default");
    const shiftTransportControlLayer = transportShiftControlLayerZone.makeControlLayer("Shift");

    const upperTransportButtons = createElements(6, (index) =>
      makeSquareButton(getSquareButtonX(index), 23),
    );
    upperTransportButtons[1].setControlLayer(defaultTransportControlLayer);
    upperTransportButtons[2].setControlLayer(defaultTransportControlLayer);

    makeBlindButton(getSquareButtonX(6), 23); // Hardware shift

    const lowerTransportButtons = createElements(
      5,
      (index) => new LedButton(surface, { position: [8.05 + index * 2.5, 25, 1.6, 1.6] }),
    );

    const channelsControlLayerZone = surface.makeControlLayerZone("Channels");

    const encodersControlLayerZone = surface.makeControlLayerZone("Encoders");
    const encodersControlLayers = [
      encodersControlLayerZone.makeControlLayer("1-4"),
      encodersControlLayerZone.makeControlLayer("5-8"),
    ];

    const channelElements = createElements(8, (index) => {
      const channelLayer = channelsControlLayerZone.makeControlLayer(`Channel ${index + 1}`);

      return {
        index,
        encoder: new LedPushEncoder(
          surface,
          x + 8.7 + (index % 4) * 3,
          9.9,
          1.75,
          1.75,
        ).setControlLayer(encodersControlLayers[Math.floor(index / 4)]),
        scribbleStrip: {
          trackTitle: surface.makeCustomValueVariable("scribbleStripTrackTitle"),
        },
        vuMeter: surface.makeCustomValueVariable("vuMeter"),
        buttons: {
          solo: makeSquareButton(2.5, 11.75, true).setControlLayer(channelLayer),
          mute: makeSquareButton(2.5, 13.5, true).setControlLayer(channelLayer),
          select: makeSquareButton(2.5, 15.25, true).setControlLayer(channelLayer),
          record: new LedButton(surface, { isChannelButton: true }),
        },

        fader: new TouchSensitiveMotorFader(surface, x + 4.1, 12.3, 1.4, 12.3).setControlLayer(
          channelLayer,
        ),
      };
    });

    const mainChannelControlLayer = channelsControlLayerZone.makeControlLayer("Main");

    return {
      width: surfaceWidth,
      channelElements,
      controlSectionElements: {
        mainFader: new TouchSensitiveMotorFader(surface, x + 4.1, 12.3, 1.4, 12.3).setControlLayer(
          mainChannelControlLayer,
        ),

        buttons: {
          flip: makeSquareButton(2.5, 21.25),
          scrub: makeSquareButton(...getUpperButtonArrayPosition(7)),

          display: upperTransportButtons[4],

          timeMode: softKeys[0][3],
          encoderAssign: {
            track: softKeys[2][0],
            pan: channelSoftKey,
            eq: softKeys[0][1],
            send: softKeys[0][0],
            plugin: softKeys[1][0],
            instrument: softKeys[0][2],
          },

          function: [...softKeys[6], ...softKeys[7]],
          number: [...softKeys[8], ...softKeys[9]],

          modify: {
            revert: softKeys[5][1],
            undo: softKeys[5][2],
            redo: softKeys[5][3],
          },
          automation: {
            read: makeSquareButton(getSquareButtonX(1), 23).setControlLayer(
              shiftTransportControlLayer,
            ),
            write: makeSquareButton(getSquareButtonX(2), 23).setControlLayer(
              shiftTransportControlLayer,
            ),
            sends: softKeys[1][2],
            project: softKeys[4][0],
            mixer: softKeys[4][1],
            motor: softKeys[4][2],
          },
          utility: {
            instrument: softKeys[1][1],
            main: softKeys[1][3],
            soloDefeat: softKeys[2][3],
            shift: upperTransportButtons[5],
          },

          transport: {
            rewind: lowerTransportButtons[0],
            forward: lowerTransportButtons[1],
            stop: lowerTransportButtons[2],
            play: lowerTransportButtons[3],
            record: lowerTransportButtons[4],

            left: softKeys[2][1],
            right: softKeys[2][2],
            cycle: upperTransportButtons[2],
            punch: softKeys[3][3],
            markers: {
              previous: softKeys[3][0],
              next: softKeys[3][1],
              add: softKeys[3][2],
            },
          },

          navigation: {
            channel: {
              left: upperTransportButtons[0],
              right: upperTransportButtons[1],
            },
            bank: {
              left: makeSquareButton(...getUpperButtonArrayPosition(4)),
              right: makeSquareButton(...getUpperButtonArrayPosition(5)),
            },
            directions: {
              left: makeSquareButton(getSquareButtonX(1) - 1.55, 18.9),
              right: makeSquareButton(getSquareButtonX(1) + 1.55, 18.9),
              up: makeSquareButton(getSquareButtonX(1), 18.9 - 1.55),
              center: makeSquareButton(getSquareButtonX(1), 18.9),
              down: makeSquareButton(getSquareButtonX(1), 18.9 + 1.55),
            },
          },
        },

        jogWheel: new JogWheel(surface, x + 14.2, 16.6, 6, 6),
      },
    };
  },

  configureEncoderMapping(defaultEncoderMappings, page) {
    const instrumentEncoderMapping = defaultEncoderMappings.pop()!;

    // Replace the instrument encoder assignment with quick controls
    instrumentEncoderMapping.pages[0] = makeFocusedQuickControlsEncoderPageConfig(page.mHostAccess);

    // Make it the default encoder mapping by defining it first
    return [instrumentEncoderMapping, ...defaultEncoderMappings];
  },
};
