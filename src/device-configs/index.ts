import {
  DecoratedDeviceSurface,
  DecoratedLamp,
  JogWheel,
  LedButton,
  LedPushEncoder,
  TouchSensitiveFader,
} from "../decorators/surface";

export interface DeviceSurface {
  width: number;
  channelElements: ChannelSurfaceElements[];
  controlSectionElements?: ControlSectionSurfaceElements;
}

export interface ChannelSurfaceElements {
  index: number;
  encoder: LedPushEncoder;
  scribbleStrip: {
    trackTitle: MR_SurfaceCustomValueVariable;
  };
  vuMeter: MR_SurfaceCustomValueVariable;
  buttons: {
    record: LedButton;
    solo: LedButton;
    mute: LedButton;
    select: LedButton;
  };
  fader: TouchSensitiveFader;
}

export interface ControlSectionSurfaceElements {
  mainFader: TouchSensitiveFader;
  jogWheel: JogWheel;
  buttons: {
    display: LedButton;
    timeMode: LedButton;
    edit: LedButton;
    flip: LedButton;
    scrub: LedButton;

    encoderAssign: LedButton[];
    number: LedButton[];
    function: LedButton[];
    modify: LedButton[];
    automation: LedButton[];
    utility: LedButton[];

    transport: LedButton[];

    navigation: {
      bank: {
        left: LedButton;
        right: LedButton;
      };
      channel: {
        left: LedButton;
        right: LedButton;
      };
      directions: {
        left: LedButton;
        right: LedButton;
        up: LedButton;
        center: LedButton;
        down: LedButton;
      };
    };
  };

  displayLeds: {
    smpte: DecoratedLamp;
    beats: DecoratedLamp;
    solo: DecoratedLamp;
  };

  expressionPedal: MR_Knob;
  footSwitches: MR_Button[];
}

export interface DeviceConfig {
  /**
   * Configures the provided `MR_DetectionPortPair` with the proper main device input and output
   * port name detection rules.
   */
  configureMainDeviceDetectionPortPair(detectionPortPair: MR_DetectionPortPair): void;

  /**
   * Creates and returns all surface elements of a main device, starting at the provided `x`
   * position.
   */
  createMainSurface(surface: DecoratedDeviceSurface, x: number): DeviceSurface;

  /**
   * Creates and returns all surface elements of an extender device, starting at the provided `x`
   * position.
   */
  createExtenderSurface(surface: DecoratedDeviceSurface, x: number): DeviceSurface;
}
