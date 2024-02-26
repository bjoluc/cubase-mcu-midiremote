/**
 * @vendor Mackie
 * @device MCU Pro
 */

import { ChannelSurfaceElements, DeviceConfig } from ".";
import { JogWheel } from "/decorators/surface-elements/JogWheel";
import { Lamp } from "/decorators/surface-elements/Lamp";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { TouchSensitiveMotorFader } from "/decorators/surface-elements/TouchSensitiveFader";
import { createElements, getArrayElements } from "/util";

const channelWidth = 4;
const channelElementsWidth = 8 * channelWidth;
const surfaceHeight = 64;

function makeChannelButton(surface: MR_DeviceSurface, channelX: number, buttonY: number) {
  return new LedButton(surface, {
    position: [0.75 + channelX, buttonY, 2.5, 1.8],
    isChannelButton: true,
  });
}

function makeControlButton(surface: MR_DeviceSurface, x: number, y: number) {
  return new LedButton(surface, { position: [x, y, 2.25, 1.75] });
}

function makeSmallButton(surface: MR_DeviceSurface, x: number, y: number) {
  return new LedButton(surface, { position: [x + 0.25, y, 1.5, 1.25] });
}

function makeChannelElements(surface: MR_DeviceSurface, x: number): ChannelSurfaceElements[] {
  return createElements(8, (index) => {
    const currentChannelXPosition = x + index * channelWidth;

    const encoder = new LedPushEncoder(surface, currentChannelXPosition, 16.25, 4, 4);
    surface.makeLabelField(currentChannelXPosition, 7, 4, 2).relateTo(encoder);

    return {
      index,
      encoder,
      scribbleStrip: {
        trackTitle: surface.makeCustomValueVariable("scribbleStripTrackTitle"),
      },
      vuMeter: surface.makeCustomValueVariable("vuMeter"),
      buttons: {
        record: new LedButton(surface, {
          position: [currentChannelXPosition + 1, 20.25, 2, 1.8],
          isChannelButton: true,
        }),
        solo: makeChannelButton(surface, currentChannelXPosition, 25),
        mute: makeChannelButton(surface, currentChannelXPosition, 27.5),
        select: makeChannelButton(surface, currentChannelXPosition, 30),
      },

      fader: new TouchSensitiveMotorFader(surface, currentChannelXPosition + 1, 36.5, 2, 16),
    };
  });
}

export const deviceConfig: DeviceConfig = {
  detectionUnits: [
    {
      main: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameStartsWith("MCU Pro USB v")
          .expectOutputNameStartsWith("MCU Pro USB v"),
      extender: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameStartsWith("MIDIIN2 (MCU Pro USB v")
          .expectOutputNameStartsWith("MIDIOUT2 (MCU Pro USB v"),
    },
  ],

  createExtenderSurface(surface, x) {
    const surfaceWidth = 3 + channelElementsWidth + 3;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    // Display bar
    surface.makeBlindPanel(x + 2.75, 6, channelElementsWidth + 0.5, 4);

    return {
      width: surfaceWidth,
      channelElements: makeChannelElements(surface, x + 3),
    };
  },

  createMainSurface(surface, x) {
    const surfaceWidth = 2 + channelElementsWidth + 29;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    // Display bar
    surface.makeBlindPanel(x + 1.75, 6, channelElementsWidth + 27.5, 4);

    const channelElements = makeChannelElements(surface, 2 + x);
    x += 2 + channelElementsWidth;

    // Assignment display
    surface.makeBlindPanel(x + 2, 7, 3, 2);

    // Time display
    surface.makeBlindPanel(x + 10.25, 7, 14, 2);

    // Transport button panel
    surface.makeBlindPanel(x + 7, 43, 20.25, 5.25);

    // Direction buttons black circle
    surface.makeBlindPanel(x + 8, 50.25, 6.5, 5).setShapeCircle();

    const encoderAssignButtons = createElements(6, (index) =>
      makeControlButton(surface, x + 0.75 + (index < 3 ? 0 : 2.5), 16.25 + (index % 3) * 2.5),
    );

    const miscControlButtons = createElements(21, (index) =>
      makeControlButton(
        surface,
        x + 7 + (index % 7) * 3,
        31.25 + Math.floor(index / 7) * 3.5 + (index < 14 ? 0 : 1.5),
      ),
    );

    const transportButtons = createElements(
      5,
      (index) =>
        new LedButton(surface, {
          position: [x + 7.75 + index * 3.65 + (index === 4 ? 0.35 : 0), 44.6, 3.75, 3],
        }),
    );

    return {
      width: surfaceWidth,
      channelElements,
      controlSectionElements: {
        mainFader: new TouchSensitiveMotorFader(surface, x + 2, 36.5, 2, 16),

        jogWheel: new JogWheel(surface, x + 15.1, 50.75, 10.5, 10.5),

        buttons: {
          display: makeSmallButton(surface, x + 7, 16.5),
          timeMode: makeSmallButton(surface, x + 9.575, 16.5),
          edit: makeControlButton(surface, x + 3.25, 30.25),
          flip: makeControlButton(surface, x + 0.75, 30.25),
          scrub: new LedButton(surface, {
            position: [x + 24.25, 50.25, 2.5, 2.5],
          }).setShapeCircle(),

          encoderAssign: {
            track: encoderAssignButtons[0],
            pan: encoderAssignButtons[1],
            eq: encoderAssignButtons[2],
            send: encoderAssignButtons[3],
            plugin: encoderAssignButtons[4],
            instrument: encoderAssignButtons[5],
          },

          number: createElements(8, (index) =>
            makeSmallButton(surface, x + 7 + index * 2.575, 26.25),
          ),
          function: createElements(8, (index) =>
            makeSmallButton(surface, x + 7 + index * 2.575, 21.25),
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
              left: makeControlButton(surface, x + 0.75, 25),
              right: makeControlButton(surface, x + 3.25, 25),
            },
            channel: {
              left: makeControlButton(surface, x + 0.75, 27.5),
              right: makeControlButton(surface, x + 3.25, 27.5),
            },
            directions: {
              left: new LedButton(surface, {
                position: [x + 7, 51.5, 2.5, 2.5],
              }).setShapeCircle(),
              right: new LedButton(surface, {
                position: [x + 13, 51.5, 2.5, 2.5],
              }).setShapeCircle(),
              up: new LedButton(surface, {
                position: [x + 10, 49, 2.5, 2.5],
              }).setShapeCircle(),
              center: new LedButton(surface, {
                position: [x + 10, 51.5, 2.5, 2.5],
              }).setShapeCircle(),
              down: new LedButton(surface, {
                position: [x + 10, 54, 2.5, 2.5],
              }).setShapeCircle(),
            },
          },
        },

        displayLeds: {
          smpte: new Lamp(surface, { position: [x + 8.5, 7.1, 0.9, 0.9] }).setShapeCircle(),
          beats: new Lamp(surface, { position: [x + 8.5, 8, 0.9, 0.9] }).setShapeCircle(),
          solo: new Lamp(surface, { position: [x + 24.75, 7.5, 1, 1] }).setShapeCircle(),
        },

        expressionPedal: surface.makeKnob(x - channelElementsWidth + 14, 2, 2, 2.6),
        footSwitch1: surface.makeButton(x - channelElementsWidth + 20, 2, 2, 2).setShapeCircle(),
        footSwitch2: surface.makeButton(x - channelElementsWidth + 17, 2, 2, 2).setShapeCircle(),
      },
    };
  },

  enhanceMapping({ lifecycleCallbacks, globalState, page }) {
    // Initially disable LCD channel metering for all devices
    lifecycleCallbacks.addActivationCallback((context) => {
      globalState.isGlobalLcdMeterModeVertical.set(context, true);
      globalState.areChannelMetersEnabled.set(context, false);
    });

    // Clear meter overloads when playback is started
    page.mHostAccess.mTransport.mValue.mStart.mOnProcessValueChange = (context, mapping, value) => {
      const isPlaybackActive = Boolean(value);
      if (isPlaybackActive !== globalState.shouldMeterOverloadsBeCleared.get(context)) {
        globalState.shouldMeterOverloadsBeCleared.set(context, isPlaybackActive);
      }
    };
  },
};
