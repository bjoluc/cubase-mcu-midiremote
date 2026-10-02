/**
 * @vendor iCON
 * @device P1 Nano
 */

import { DeviceConfig, MainDeviceSurface } from ".";
import { JogWheel } from "/decorators/surface-elements/JogWheel";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { TouchSensitiveMotorFader } from "/decorators/surface-elements/TouchSensitiveMotorFader";
import { MainDevice } from "/devices";
import * as pageConfigs from "/mapping/encoders/page-configs";
import { IconColorManager } from "/midi/managers/colors/IconColorManager";
import { createElements } from "/util";

const channelWidth = 2.55;
const surfaceHeight = 22.25;
const surfaceWidth = channelWidth * 8 + 0.5;

/**
 * Additional surface elements for main devices
 */
interface MainDeviceCustomElements {
  buttonMatrix: LedButton[][][];
  emptyHardwareButtons: LedButton[];
}

export const deviceConfig: DeviceConfig = {
  colorManager: IconColorManager,
  maximumMeterValue: 0xc,
  hasIndividualScribbleStrips: true,
  secondaryScribbleStripSetup: "joint",

  detectionUnits: [
    {
      main: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameStartsWith("iCON P1-Nano")
          .expectOutputNameStartsWith("iCON P1-Nano"),
      extender: () => {},
    },
  ],

  createMainSurface(surface, x): MainDeviceSurface<MainDeviceCustomElements> {
    const makeRoundBlindPanel = (x: number, y: number, size = 1.25) =>
      surface.makeBlindPanel(x, y, size, size).setShapeCircle();

    const getChannelButtonPosition = (row: number): [number, number, number, number] => [
      x + 4.125,
      13.05 + row * 1.375,
      1.25,
      1.25,
    ];

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    // Channel display
    surface.makeBlindPanel(x + 4, 5.75, 3, 3.75);

    // Time display
    surface.makeBlindPanel(x + 7.6, 5.75, 8.25, 1.5);

    // DAW buttons
    makeRoundBlindPanel(15.9, 6.25);
    makeRoundBlindPanel(17.075, 5.6);
    makeRoundBlindPanel(18.25, 6.25);

    // Move, shuffle, and zoom buttons
    makeRoundBlindPanel(8.4, 18.65, 1.15);
    makeRoundBlindPanel(9.3, 18, 1.15);
    makeRoundBlindPanel(10.4, 17.7, 1.15);

    makeRoundBlindPanel(16, 17.7, 1.15);
    makeRoundBlindPanel(17.1, 18, 1.15);
    makeRoundBlindPanel(18, 18.65, 1.15);

    // Main button
    surface.makeBlindPanel(...getChannelButtonPosition(4));

    // Function layer buttons and lock button
    createElements(2, (column) => {
      surface.makeBlindPanel(x + 7.75 + column * 1.9, 8, 1.75, 1.75);
    });
    createElements(4, (row) => {
      makeRoundBlindPanel(x + 6, 10.1 + row * 1.15);
    });

    const channelsControlLayerZone = surface.makeControlLayerZone("Channels");

    const channelElements = createElements(8, (index) => {
      const channelXPosition = x + channelWidth * index;

      const channelLayer = channelsControlLayerZone.makeControlLayer(`Channel ${index + 1}`);

      const [muteButton, soloButton, recordButton] = createElements(3, (row) =>
        new LedButton(surface, {
          position: getChannelButtonPosition(row),
          isChannelButton: true,
        }).setControlLayer(channelLayer),
      );

      recordButton.setShapeCircle();

      const encoder = new LedPushEncoder(surface, channelXPosition + 0.5, 4, 2, 2);

      // Scribble strip
      surface.makeBlindPanel(channelXPosition + 0.25, 0.5, channelWidth, 2);
      surface
        .makeLabelField(channelXPosition + 0.5, 0.75, channelWidth - 0.5, 0.75)
        .relateTo(recordButton);
      surface
        .makeLabelField(channelXPosition + 0.5, 1.5, channelWidth - 0.5, 0.75)
        .relateTo(encoder);

      return {
        index,
        encoder,
        scribbleStrip: {
          trackTitle: surface.makeCustomValueVariable("Track Title"),
          meterPeakLevel: surface.makeCustomValueVariable("Meter Peak Level"),
        },
        vuMeter: surface.makeCustomValueVariable("VU Meter"),
        buttons: {
          record: recordButton,
          solo: soloButton,
          mute: muteButton,
          select: new LedButton(surface, { isChannelButton: true }),
        },

        fader: new TouchSensitiveMotorFader(surface, x + 1.7, 8, 1.5, 11).setControlLayer(
          channelLayer,
        ),
      };
    });

    const navigationButtons = createElements(
      4,
      (buttonIndex) =>
        new LedButton(surface, { position: [x + 6, 14.8 + buttonIndex * 1.25, 1.25, 1.25] }),
    );

    // Button matrix
    const buttonMatrixControlLayerZone = surface.makeControlLayerZone("Touch Buttons");
    const buttonMatrix = createElements(5, (layerIndex) => {
      const controlLayer = buttonMatrixControlLayerZone.makeControlLayer(
        "Layer " + (layerIndex < 3 ? layerIndex + 1 : "U" + (layerIndex - 3)),
      );

      return createElements(4, (row) =>
        createElements(4, (column) =>
          new LedButton(surface, {
            position: [x + 12.45 + column * 1.75, 8 + row * 1.75, 1.75, 1.75],
          }).setControlLayer(controlLayer),
        ),
      );
    });

    const leftButtonMatrix = createElements(3, (row) =>
      createElements(
        2,
        (column) =>
          new LedButton(surface, {
            position: [x + 7.75 + column * 1.9, 8 + (row + 1) * 1.75, 1.75, 1.75],
          }),
      ),
    );

    const transportButtons: LedButton[] = [];
    let nextTransportButtonXPosition = x + 7.85;
    for (const buttonWidth of [1.5, 1.5, 1.5, 1.9, 2.65, 2.65]) {
      transportButtons.push(
        new LedButton(surface, {
          position: [nextTransportButtonXPosition, 15.9, buttonWidth, 1.7],
        }),
      );
      nextTransportButtonXPosition += buttonWidth + 0.04;
    }

    const mainControlLayer = channelsControlLayerZone.makeControlLayer("Main");

    return {
      width: surfaceWidth,
      channelElements,
      controlSectionElements: {
        mainFader: new TouchSensitiveMotorFader(surface, x + 1.7, 8, 1.5, 11).setControlLayer(
          mainControlLayer,
        ),
        mainVuMeters: {
          left: surface.makeCustomValueVariable("Main VU Meter L"),
          right: surface.makeCustomValueVariable("Main VU Meter R"),
        },

        jogWheel: new JogWheel(surface, x + 12.025, 17.75, 3.5, 3.5),

        buttons: {
          navigation: {
            bank: { left: navigationButtons[0], right: navigationButtons[1] },
            channel: { left: navigationButtons[2], right: navigationButtons[3] },
          },
          flip: new LedButton(surface, { position: [x + 4.125, 13 + 3 * 1.42, 1.25, 1.25] }),
          display: buttonMatrix[0][1][2],
          timeMode: buttonMatrix[0][1][3],
          scrub: buttonMatrix[1][2][3],
          edit: buttonMatrix[0][0][0],
          encoderAssign: {
            pan: buttonMatrix[2][0][0],
            eq: buttonMatrix[2][2][0],
            send: buttonMatrix[2][2][1],
            plugin: buttonMatrix[2][1][0],
          },
          modify: {
            undo: buttonMatrix[0][2][0],
            redo: buttonMatrix[0][2][1],
            save: buttonMatrix[0][3][0],
          },
          automation: {
            read: leftButtonMatrix[0][0],
            write: leftButtonMatrix[0][1],
            motor: buttonMatrix[0][2][3],
            mixer: buttonMatrix[0][0][2],
            project: buttonMatrix[0][0][3],
          },
          utility: {
            instrument: buttonMatrix[0][1][0],
            main: buttonMatrix[0][1][1],
            soloDefeat: buttonMatrix[0][2][2],
            shift: buttonMatrix[0][3][3],
          },
          transport: {
            rewind: transportButtons[0],
            forward: transportButtons[1],
            cycle: transportButtons[2],
            stop: transportButtons[3],
            play: transportButtons[4],
            record: transportButtons[5],
            punch: buttonMatrix[1][2][1],
            markers: {
              previous: buttonMatrix[1][3][0],
              add: buttonMatrix[1][3][1],
              next: buttonMatrix[1][3][2],
            },
            left: buttonMatrix[0][3][1],
            right: buttonMatrix[0][3][2],
          },
        },

        // TODO Add foot switches to surfaces
        // footSwitch1: surface.makeButton(x - channelWidth * 2 + 2, 2.5, 1, 1).setShapeCircle(),
        // footSwitch2: surface.makeButton(x - channelWidth * 3 + 2, 2.5, 1, 1).setShapeCircle(),
      },

      customElements: {
        buttonMatrix,
        emptyHardwareButtons: leftButtonMatrix.slice(1).flat(),
      },
    };
  },

  enhanceMapping({ devices, page, lifecycleCallbacks }) {
    const device = devices[0] as MainDevice<MainDeviceCustomElements>;

    // Map remaining button matrix buttons
    const { ports } = device;
    const buttonMatrix = device.customElements.buttonMatrix;

    // Bind remaining matrix buttons to MIDI notes on Channel 2
    const channel2Buttons: LedButton[] = [];
    for (const [layerId, layer] of buttonMatrix.entries()) {
      for (const [rowId, row] of layer.entries()) {
        for (const [columnId, button] of row.entries()) {
          if (!button.isBoundToNote()) {
            channel2Buttons.push(button);
            button.bindToNote(ports, layerId * 16 + rowId * 4 + columnId, 1); // Channel 2
          }
        }
      }
    }

    // Map empty hardware buttons
    for (const [buttonIndex, button] of device.customElements.emptyHardwareButtons.entries()) {
      button.bindToNote(ports, 80 + buttonIndex, 1); // Channel 2
    }

    // Reset non-MCU (channel 2) buttons on (de)activation
    const resetChannel2Buttons = (context: MR_ActiveDevice) => {
      for (const button of [...channel2Buttons, ...device.customElements.emptyHardwareButtons]) {
        button.sendNoteOn(context, 0);
      }
    };

    lifecycleCallbacks.addActivationCallback(resetChannel2Buttons);
    lifecycleCallbacks.addDeactivationCallback(resetChannel2Buttons);

    // Host mappings
    // Edit instrument
    page
      .makeValueBinding(
        buttonMatrix[0][0][1].mSurfaceValue,
        page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mInstrumentOpen,
      )
      .setTypeToggle();

    // Reset meters
    page.makeCommandBinding(buttonMatrix[1][2][2].mSurfaceValue, "Mixer", "Meters: Reset");

    // Click
    page
      .makeValueBinding(
        buttonMatrix[1][2][0].mSurfaceValue,
        page.mHostAccess.mTransport.mValue.mMetronomeActive,
      )
      .setTypeToggle();
  },

  getSupplementaryShiftButtons(device: MainDevice<MainDeviceCustomElements>) {
    const buttonMatrix = device.customElements.buttonMatrix;
    return [buttonMatrix[1][3][3], buttonMatrix[2][3][3]];
  },

  configureEncoderMappings(defaultEncoderMapping, page) {
    const makeActivatorButtonSelector = (row: number, column: number) => (device: MainDevice) =>
      (device as MainDevice<MainDeviceCustomElements>).customElements.buttonMatrix[2][row][column];

    const hostAccess = page.mHostAccess;
    return [
      // Define Focus Quick Control first to make it the default encoder mapping
      {
        pages: [pageConfigs.focusedQuickControls(hostAccess)],
        activatorButtonSelector: makeActivatorButtonSelector(1, 3),
      },

      // The default six MCU encoder assign button mappings are included for backwards compatibility
      // with the default iMAP Cubase button functions:
      ...defaultEncoderMapping,

      // These are additional, fine-grained encoder mappings:
      {
        pages: [pageConfigs.monitor],
        activatorButtonSelector: makeActivatorButtonSelector(0, 1),
      },
      {
        pages: [pageConfigs.inputGain, pageConfigs.inputPhase],
        activatorButtonSelector: makeActivatorButtonSelector(0, 2),
      },
      {
        pages: [pageConfigs.lowCut, pageConfigs.highCut],
        activatorButtonSelector: makeActivatorButtonSelector(0, 3),
      },

      {
        pages: [pageConfigs.vstQuickControls(hostAccess)],
        activatorButtonSelector: makeActivatorButtonSelector(1, 1),
      },
      {
        pages: [pageConfigs.trackQuickControls(hostAccess)],
        activatorButtonSelector: makeActivatorButtonSelector(1, 2),
      },

      // Strip effects
      {
        pages: [pageConfigs.stripEffectGate(hostAccess)],
        activatorButtonSelector: makeActivatorButtonSelector(2, 2),
      },
      {
        pages: [pageConfigs.stripEffectCompressor(hostAccess)],
        activatorButtonSelector: makeActivatorButtonSelector(2, 3),
      },
      {
        pages: [pageConfigs.stripEffectTools(hostAccess)],
        activatorButtonSelector: makeActivatorButtonSelector(3, 0),
      },
      {
        pages: [pageConfigs.stripEffectSaturator(hostAccess)],
        activatorButtonSelector: makeActivatorButtonSelector(3, 1),
      },
      {
        pages: [pageConfigs.stripEffectLimiter(hostAccess)],
        activatorButtonSelector: makeActivatorButtonSelector(3, 2),
      },
    ];
  },
};
