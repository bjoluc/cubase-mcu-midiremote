/**
 * @vendor iCON
 * @device V1-M
 */

import { ChannelSurfaceElements, DeviceConfig, MainDeviceSurface } from ".";
import { JogWheel } from "/decorators/surface-elements/JogWheel";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { TouchSensitiveMotorFader } from "/decorators/surface-elements/TouchSensitiveFader";
import { MainDevice } from "/devices";
import * as pageConfigs from "/mapping/encoders/page-configs";
import { IconColorManager } from "/midi/managers/colors/IconColorManager";
import { createElements } from "/util";

const channelWidth = 3.5;
const channelElementsWidth = 8 * channelWidth;
const surfaceHeight = 38;
const deviceFramePaddingWidth = 0.8;

/**
 * Additional surface elements for main devices
 */
interface MainDeviceCustomElements {
  buttonMatrix: LedButton[][][];
}

function makeChannelElements(surface: MR_DeviceSurface, x: number): ChannelSurfaceElements[] {
  // Secondary scribble strip frame
  // surface.makeBlindPanel(x + deviceFramePaddingWidth, 20 - 0.25, channelElementsWidth, 2.5);

  return createElements(8, (index) => {
    const currentChannelXPosition = x + deviceFramePaddingWidth + index * channelWidth;

    const [recordButton, soloButton, muteButton, selectButton] = createElements(
      4,
      (row) =>
        new LedButton(surface, {
          position: [currentChannelXPosition + 1 - 0.125, 11.5 + row * 2 - 0.125, 1.75, 1.75],
          isChannelButton: true,
        }),
    );

    const encoder = new LedPushEncoder(surface, currentChannelXPosition + 0.75, 9.5, 2, 2);

    // VU meter
    surface.makeBlindPanel(currentChannelXPosition + 1.3, 1.25, 0.9, 2.5);

    // Primary scribble strip
    surface.makeBlindPanel(currentChannelXPosition, 4, channelWidth, 2.5);
    surface
      .makeLabelField(currentChannelXPosition + 0.25, 4.25, channelWidth - 0.5, 0.75)
      .relateTo(selectButton);
    surface
      .makeLabelField(currentChannelXPosition + 0.25, 4.25 + 0.75, channelWidth - 0.5, 0.75)
      .relateTo(encoder);

    // Secondary scribble strip
    surface.makeBlindPanel(currentChannelXPosition + 0.25, 20, channelWidth - 0.5, 2);
    surface
      .makeLabelField(currentChannelXPosition + 0.5, 20.25, channelWidth - 1, 0.75)
      .relateTo(selectButton);
    surface.makeLabelField(currentChannelXPosition + 0.5, 20.25 + 0.75, channelWidth - 1, 0.75);

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
        select: selectButton,
      },

      fader: new TouchSensitiveMotorFader(surface, currentChannelXPosition + 1, 24.5, 1.5, 11),
    };
  });
}

export const deviceConfig: DeviceConfig = {
  colorManager: IconColorManager,
  maximumMeterValue: 0xc,
  hasIndividualScribbleStrips: true,
  hasSecondaryScribbleStrips: true,

  detectionUnits: [
    {
      main: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameStartsWith("iCON V1-M")
          .expectOutputNameStartsWith("iCON V1-M"),
      extender: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameStartsWith("iCON V1-X1")
          .expectOutputNameStartsWith("iCON V1-X1"),
    },
  ],

  createExtenderSurface(surface, x) {
    const surfaceWidth = channelElementsWidth + deviceFramePaddingWidth * 2;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    return {
      width: surfaceWidth,
      channelElements: makeChannelElements(surface, x),
    };
  },

  createMainSurface(surface, x): MainDeviceSurface<MainDeviceCustomElements> {
    const surfaceWidth = channelElementsWidth + 19;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    const channelElements = makeChannelElements(surface, x);
    x += deviceFramePaddingWidth + channelElementsWidth;

    // Main VU meters
    surface.makeBlindPanel(x + 1.3, 1.25, 0.9, 2.5);
    surface.makeBlindPanel(x + 2.3, 1.25, 0.9, 2.5);

    // Time display
    surface.makeBlindPanel(x + 4.75, 4.75, 10.25, 1.5);

    // DAW and Function Layer buttons
    createElements(8, (buttonIndex) => {
      surface
        .makeBlindPanel(x + 2 + buttonIndex * 1.65 + +(buttonIndex > 2) * 0.75, 9.125, 1.5, 1.5)
        .setShapeCircle();
    });

    // Button matrix
    const buttonMatrixControlLayerZone = surface.makeControlLayerZone("Touch Buttons");
    const buttonMatrix = createElements(3, (layerIndex) => {
      const controlLayer = buttonMatrixControlLayerZone.makeControlLayer(
        "Layer " + (layerIndex < 3 ? layerIndex + 1 : "U" + (layerIndex - 3)),
      );

      return createElements(4, (row) =>
        createElements(6, (column) =>
          new LedButton(surface, {
            position: [x + 1.25 + column * 2.5, 12.25 + row * 2, 2.5, 2],
          }).setControlLayer(controlLayer),
        ),
      );
    });

    const lowerButtonMatrix = createElements(2, (row) =>
      createElements(
        6,
        (column) =>
          new LedButton(surface, {
            position: [x + 3.5 + column * 2.25, 22.75 + row * 1.75, 2.125, 1.5],
          }),
      ),
    );

    const transportButtons: LedButton[] = [];
    let nextTransportButtonXPosition = x + 3.5;
    for (const buttonWidth of [1.575, 1.575, 1.575, 2.005, 3.01, 3.01]) {
      transportButtons.push(
        new LedButton(surface, {
          position: [nextTransportButtonXPosition, 22.75 + 2 * 1.75, buttonWidth, 1.5],
        }),
      );
      nextTransportButtonXPosition += buttonWidth + 0.125;
    }

    return {
      width: surfaceWidth,
      channelElements,
      controlSectionElements: {
        mainFader: new TouchSensitiveMotorFader(surface, x + 1, 24.5, 1.5, 11),
        mainVuMeters: {
          left: surface.makeCustomValueVariable("Main VU Meter L"),
          right: surface.makeCustomValueVariable("Main VU Meter R"),
        },

        jogWheel: new JogWheel(surface, x + 6.675, 29, 7, 7),

        buttons: {
          navigation: {
            channel: { left: lowerButtonMatrix[0][0], right: lowerButtonMatrix[0][1] },
            bank: { left: lowerButtonMatrix[0][2], right: lowerButtonMatrix[0][3] },
          },
          flip: lowerButtonMatrix[0][4],

          display: buttonMatrix[0][0][4],
          timeMode: buttonMatrix[0][0][5],
          scrub: buttonMatrix[0][1][4],
          edit: buttonMatrix[0][0][2],

          modify: {
            undo: buttonMatrix[0][2][0],
            redo: buttonMatrix[0][2][1],
            save: buttonMatrix[0][3][0],
            revert: buttonMatrix[0][3][1],
          },

          automation: {
            read: lowerButtonMatrix[1][1],
            write: lowerButtonMatrix[1][3],
            motor: buttonMatrix[0][1][5],
            mixer: buttonMatrix[0][0][0],
            project: buttonMatrix[0][0][1],
          },

          utility: {
            instrument: buttonMatrix[0][1][0],
            main: buttonMatrix[0][1][1],
            soloDefeat: buttonMatrix[0][2][2],
            shift: buttonMatrix[0][3][5],
          },

          transport: {
            rewind: transportButtons[0],
            forward: transportButtons[1],
            cycle: transportButtons[2],
            stop: transportButtons[3],
            play: transportButtons[4],
            record: transportButtons[5],

            punch: buttonMatrix[0][1][3],
            markers: {
              previous: buttonMatrix[0][2][3],
              add: buttonMatrix[0][2][4],
              next: buttonMatrix[0][2][5],
            },
            left: buttonMatrix[0][3][3],
            right: buttonMatrix[0][3][4],
          },
        },

        // footSwitch1: surface.makeButton(x + 22.1, 3.5, 1.5, 1.5).setShapeCircle(),
        // footSwitch2: surface.makeButton(x + 22.1 + 2, 3.5, 1.5, 1.5).setShapeCircle(),
      },

      customElements: {
        buttonMatrix,
      },
    };
  },

  enhanceMapping({ devices, page }) {
    const mainDevices = devices.filter(
      (device) => device instanceof MainDevice,
    ) as MainDevice<MainDeviceCustomElements>[];

    // Map remaining button matrix buttons for each main device
    for (const device of mainDevices) {
      const { ports } = device;
      const buttonMatrix = device.customElements.buttonMatrix;

      // MIDI Bindings
      // Remaining buttons in Layer 1
      buttonMatrix[0][0][3].bindToNote(ports, 119, 0);
      buttonMatrix[0][1][2].bindToNote(ports, 120, 0);
      buttonMatrix[0][3][2].bindToNote(ports, 121, 0);

      // Layer 2 & 3
      for (const [layerId, layer] of buttonMatrix.slice(1).entries()) {
        for (const [rowId, row] of layer.entries()) {
          for (const [columnId, button] of row.entries()) {
            if (layerId === 0 && rowId === 0) {
              button.bindToNote(ports, 122 + columnId);
            } else {
              button.bindToNote(ports, (layerId + 1) * 24 + rowId * 6 + columnId, 1); // Channel 2
            }
          }
        }
      }

      // Host mappings
      // Edit instrument
      page
        .makeValueBinding(
          buttonMatrix[0][0][3].mSurfaceValue,
          page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mInstrumentOpen,
        )
        .setTypeToggle();

      // Reset meters
      page.makeCommandBinding(buttonMatrix[0][1][2].mSurfaceValue, "Mixer", "Meters: Reset");

      // Click
      page
        .makeValueBinding(
          buttonMatrix[0][3][2].mSurfaceValue,
          page.mHostAccess.mTransport.mValue.mMetronomeActive,
        )
        .setTypeToggle();
    }
  },

  getSupplementaryShiftButtons(device: MainDevice<MainDeviceCustomElements>) {
    const buttonMatrix = device.customElements.buttonMatrix;
    return [buttonMatrix[1][3][5], buttonMatrix[2][3][5]];
  },

  configureEncoderMappings(defaultEncoderMapping, page) {
    const makeActivatorButtonSelector = (row: number, column: number) => (device: MainDevice) =>
      (device as MainDevice<MainDeviceCustomElements>).customElements.buttonMatrix[1][row][column];

    const hostAccess = page.mHostAccess;
    return [
      ...[
        pageConfigs.pan,
        pageConfigs.monitor,
        pageConfigs.inputGain,
        pageConfigs.inputPhase,
        pageConfigs.lowCut,
        pageConfigs.highCut,
      ].map((pageConfig, buttonColumn) => ({
        pages: [pageConfig],
        activatorButtonSelector: makeActivatorButtonSelector(0, buttonColumn),
      })),

      {
        pages: [pageConfigs.eq(hostAccess)],
        activatorButtonSelector: makeActivatorButtonSelector(1, 0),
      },
      {
        pages: [pageConfigs.sends(hostAccess)],
        activatorButtonSelector: makeActivatorButtonSelector(1, 1),
      },
      pageConfigs.pluginMappingConfig(page, makeActivatorButtonSelector(1, 2)),
      {
        activatorButtonSelector: makeActivatorButtonSelector(1, 3),
        pages: [pageConfigs.vstQuickControls(hostAccess)],
      },
      {
        activatorButtonSelector: makeActivatorButtonSelector(1, 4),
        pages: [pageConfigs.trackQuickControls(hostAccess)],
      },
      {
        activatorButtonSelector: makeActivatorButtonSelector(1, 5),
        pages: [pageConfigs.focusedQuickControls(hostAccess)],
      },

      // Strip effects
      ...[
        pageConfigs.stripEffectGate(hostAccess),
        pageConfigs.stripEffectCompressor(hostAccess),
        pageConfigs.stripEffectTools(hostAccess),
        pageConfigs.stripEffectSaturator(hostAccess),
        pageConfigs.stripEffectLimiter(hostAccess),
      ].map((pageConfig, buttonColumn) => ({
        pages: [pageConfig],
        activatorButtonSelector: makeActivatorButtonSelector(2, buttonColumn),
      })),
    ];
  },
};
