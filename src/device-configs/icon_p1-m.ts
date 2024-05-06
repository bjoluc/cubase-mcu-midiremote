/**
 * @vendor iCON
 * @device P1-M
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
const surfaceHeight = 22.25;
const deviceFramePaddingWidth = 0.75;

/**
 * Additional surface elements for main devices
 */
interface MainDeviceCustomElements {
  buttonMatrix: LedButton[][][];
}

function makeChannelElements(surface: MR_DeviceSurface, x: number): ChannelSurfaceElements[] {
  return createElements(8, (index) => {
    const currentChannelXPosition = x + deviceFramePaddingWidth + index * channelWidth;

    const [recordButton, soloButton, muteButton, selectButton] = createElements(
      4,
      (row) =>
        new LedButton(surface, {
          position: [currentChannelXPosition + 2 + 1 / 16, 12 + row * (1.25 + 1 / 16), 1.25, 1.25],
          isChannelButton: true,
        }),
    );

    selectButton.setShapeCircle();

    const encoder = new LedPushEncoder(surface, currentChannelXPosition + 0.75, 4, 2, 2);

    // VU meter
    surface.makeBlindPanel(currentChannelXPosition + 2.225 + 1 / 16, 6.125, 0.8, 4);

    // Scribble strip
    surface.makeBlindPanel(currentChannelXPosition, 0.5, channelWidth, 2);
    surface
      .makeLabelField(currentChannelXPosition + 0.25, 0.75, channelWidth - 0.5, 0.75)
      .relateTo(selectButton);
    surface
      .makeLabelField(currentChannelXPosition + 0.25, 1.5, channelWidth - 0.5, 0.75)
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
        select: selectButton,
      },

      fader: new TouchSensitiveMotorFader(surface, currentChannelXPosition + 0.25, 8, 1.5, 11),
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
          .expectInputNameStartsWith("iCON P1-M")
          .expectOutputNameStartsWith("iCON P1-M"),
      extender: (detectionPortPair, extenderNumber) =>
        detectionPortPair
          .expectInputNameStartsWith(`iCON P1-X${extenderNumber}`)
          .expectOutputNameStartsWith(`iCON P1-X${extenderNumber}`),
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
    const surfaceWidth = channelElementsWidth + 11.5;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    const channelElements = makeChannelElements(surface, x);
    x += deviceFramePaddingWidth + channelElementsWidth;

    // Time display
    surface.makeBlindPanel(x + 1, 1, 8.5, 1);

    // Function Layer buttons
    createElements(5, (buttonIndex) => {
      surface.makeBlindPanel(x, 5 + buttonIndex * (1.25 + 0.1), 1.25, 1.25).setShapeCircle();
    });

    // DAW buttons
    createElements(3, (buttonIndex) => {
      surface.makeBlindPanel(x + 3.7 + buttonIndex * 1.75, 4.25, 1.25, 1.25).setShapeCircle();
    });

    // Button matrix
    const buttonMatrixControlLayerZone = surface.makeControlLayerZone("Touch Buttons");
    const buttonMatrix = createElements(3, (layerIndex) => {
      const controlLayer = buttonMatrixControlLayerZone.makeControlLayer(
        "Layer " + (layerIndex < 3 ? layerIndex + 1 : "U" + (layerIndex - 3)),
      );

      return createElements(4, (row) =>
        createElements(4, (column) =>
          new LedButton(surface, {
            position: [x + 2 + column * 1.75, 6 + row * 1.75, 1.75, 1.75],
          }).setControlLayer(controlLayer),
        ),
      );
    });

    const lowerButtonMatrix = createElements(2, (row) =>
      createElements(
        6,
        (column) =>
          new LedButton(surface, {
            position: [x + 0.375 + column * 1.6, 13.75 + row * 1.3, 1.56, 1.25],
          }),
      ),
    );

    const transportButtons: LedButton[] = [];
    let nextTransportButtonXPosition = x + 0.375;
    for (const buttonWidth of [1.32, 1.32, 1.32, 1.6, 2, 2]) {
      transportButtons.push(
        new LedButton(surface, {
          position: [nextTransportButtonXPosition, 13.75 + 2 * 1.3, buttonWidth, 1.25],
        }),
      );
      nextTransportButtonXPosition += buttonWidth; // + 0.125
    }

    const lastChannelControlLayerZone = surface.makeControlLayerZone("Channel 8 / Main");
    const channel8ControlLayer = lastChannelControlLayerZone.makeControlLayer("Channel 8");
    const mainControlLayer = lastChannelControlLayerZone.makeControlLayer("Main");

    channelElements[7].fader.setControlLayer(channel8ControlLayer);

    return {
      width: surfaceWidth,
      channelElements,
      controlSectionElements: {
        mainFader: new TouchSensitiveMotorFader(
          surface,
          x - channelWidth + 0.25,
          8,
          1.5,
          11,
        ).setControlLayer(mainControlLayer),
        mainVuMeters: {
          left: surface.makeCustomValueVariable("Main VU Meter L"),
          right: surface.makeCustomValueVariable("Main VU Meter R"),
        },

        jogWheel: new JogWheel(surface, x + 3.405, 17.75, 3.5, 3.5),

        buttons: {
          navigation: {
            channel: { left: lowerButtonMatrix[0][0], right: lowerButtonMatrix[0][1] },
            bank: { left: lowerButtonMatrix[0][2], right: lowerButtonMatrix[0][3] },
          },
          flip: lowerButtonMatrix[0][4],
          //
          // display: buttonMatrix[0][0][4],
          // timeMode: buttonMatrix[0][0][5],
          // scrub: buttonMatrix[0][1][4],
          // edit: buttonMatrix[0][0][0],
          //
          // encoderAssign: {
          //   pan: buttonMatrix[1][0][0],
          //   eq: buttonMatrix[1][1][0],
          //   send: buttonMatrix[1][1][1],
          //   plugin: buttonMatrix[1][1][2],
          // },
          //
          // modify: {
          //   undo: buttonMatrix[0][2][0],
          //   redo: buttonMatrix[0][2][1],
          //   save: buttonMatrix[0][3][0],
          //   revert: buttonMatrix[0][3][1],
          // },
          //
          automation: {
            read: lowerButtonMatrix[1][1],
            write: lowerButtonMatrix[1][3],
            //   motor: buttonMatrix[0][1][5],
            //   mixer: buttonMatrix[0][0][2],
            //   project: buttonMatrix[0][0][3],
          },
          //
          // utility: {
          //   instrument: buttonMatrix[0][1][0],
          //   main: buttonMatrix[0][1][1],
          //   soloDefeat: buttonMatrix[0][2][2],
          //   shift: buttonMatrix[0][3][5],
          // },
          //
          transport: {
            rewind: transportButtons[0],
            forward: transportButtons[1],
            cycle: transportButtons[2],
            stop: transportButtons[3],
            play: transportButtons[4],
            record: transportButtons[5],

            // punch: buttonMatrix[0][1][3],
            // markers: {
            //   previous: buttonMatrix[0][2][3],
            //   add: buttonMatrix[0][2][4],
            //   next: buttonMatrix[0][2][5],
            // },
            // left: buttonMatrix[0][3][3],
            // right: buttonMatrix[0][3][4],
          },
        },

        footSwitch1: surface.makeButton(x - channelWidth * 2 + 2, 2.5, 1, 1).setShapeCircle(),
        footSwitch2: surface.makeButton(x - channelWidth * 3 + 2, 2.5, 1, 1).setShapeCircle(),
      },

      customElements: {
        buttonMatrix,
      },
    };
  },

  enhanceMapping({ devices, page }) {
    /*
    const mainDevices = devices.filter(
      (device) => device instanceof MainDevice,
    ) as MainDevice<MainDeviceCustomElements>[];

    // Map remaining button matrix buttons for each main device
    for (const device of mainDevices) {
      const { ports } = device;
      const buttonMatrix = device.customElements.buttonMatrix;

      // MIDI Bindings
      // Remaining buttons in Layer 1
      buttonMatrix[0][0][1].bindToNote(ports, 119, 0);
      buttonMatrix[0][1][2].bindToNote(ports, 120, 0);
      buttonMatrix[0][3][2].bindToNote(ports, 121, 0);

      // Remaining buttons in Layer 2 & 3
      for (const [layerId, layer] of buttonMatrix.slice(1).entries()) {
        for (const [rowId, row] of layer.entries()) {
          for (const [columnId, button] of row.entries()) {
            if (!button.isBoundToNote()) {
              if (layerId === 0 && rowId === 0) {
                button.bindToNote(ports, 122 + columnId);
              } else {
                button.bindToNote(ports, (layerId + 1) * 24 + rowId * 6 + columnId, 1); // Channel 2
              }
            }
          }
        }
      }

      // Host mappings
      // Edit instrument
      page
        .makeValueBinding(
          buttonMatrix[0][0][1].mSurfaceValue,
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
    */
  },

  // getSupplementaryShiftButtons(device: MainDevice<MainDeviceCustomElements>) {
  //   const buttonMatrix = device.customElements.buttonMatrix;
  //   return [buttonMatrix[1][3][5], buttonMatrix[2][3][5]];
  // },

  // configureEncoderMappings(defaultEncoderMapping, page) {
  //   const makeActivatorButtonSelector = (row: number, column: number) => (device: MainDevice) =>
  //     (device as MainDevice<MainDeviceCustomElements>).customElements.buttonMatrix[1][row][column];

  //   const hostAccess = page.mHostAccess;
  //   return [
  //     // The default six MCU encoder assign button mappings are included for backwards compatibility
  //     // with the default iMAP Cubase button functions:
  //     ...defaultEncoderMapping,

  //     // These are additional, fine-grained encoder mappings:

  //     ...[
  //       pageConfigs.monitor,
  //       pageConfigs.inputGain,
  //       pageConfigs.inputPhase,
  //       pageConfigs.lowCut,
  //       pageConfigs.highCut,
  //     ].map((pageConfig, buttonIndex) => ({
  //       pages: [pageConfig],
  //       activatorButtonSelector: makeActivatorButtonSelector(0, buttonIndex + 1),
  //     })),

  //     {
  //       activatorButtonSelector: makeActivatorButtonSelector(1, 3),
  //       pages: [pageConfigs.vstQuickControls(hostAccess)],
  //     },
  //     {
  //       activatorButtonSelector: makeActivatorButtonSelector(1, 4),
  //       pages: [pageConfigs.trackQuickControls(hostAccess)],
  //     },
  //     {
  //       activatorButtonSelector: makeActivatorButtonSelector(1, 5),
  //       pages: [pageConfigs.focusedQuickControls(hostAccess)],
  //     },

  //     // Strip effects
  //     ...[
  //       pageConfigs.stripEffectGate(hostAccess),
  //       pageConfigs.stripEffectCompressor(hostAccess),
  //       pageConfigs.stripEffectTools(hostAccess),
  //       pageConfigs.stripEffectSaturator(hostAccess),
  //       pageConfigs.stripEffectLimiter(hostAccess),
  //     ].map((pageConfig, buttonColumn) => ({
  //       pages: [pageConfig],
  //       activatorButtonSelector: makeActivatorButtonSelector(2, buttonColumn),
  //     })),
  //   ];
  // },
};
