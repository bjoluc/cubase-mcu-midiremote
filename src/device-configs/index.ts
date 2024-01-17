import { JogWheel } from "/decorators/surface-elements/JogWheel";
import { Lamp } from "/decorators/surface-elements/Lamp";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { TouchSensitiveMotorFader } from "/decorators/surface-elements/TouchSensitiveFader";

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
  fader: TouchSensitiveMotorFader;
}

export interface ControlSectionButtons {
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
}

export interface ControlSectionSurfaceElements {
  mainFader: TouchSensitiveMotorFader;
  jogWheel: JogWheel;
  buttons: ControlSectionButtons;

  displayLeds: {
    smpte: Lamp;
    beats: Lamp;
    solo: Lamp;
  };

  expressionPedal: MR_Knob;
  footSwitches: MR_Button[];
}

export interface DeviceConfig {
  detectionUnits: Array<{
    /**
     * A function that configures a `MR_DetectionPortPair` with main device input and output port
     * name detection rules.
     */
    main: (detectionPortPair: MR_DetectionPortPair) => void;

    /**
     * A function that configures a `MR_DetectionPortPair` with extender input and output port name
     * detection rules.
     */
    extender: (detectionPortPair: MR_DetectionPortPair) => void;
  }>;

  /**
   * Creates and returns all surface elements of a main device, starting at the provided `x`
   * position.
   */
  createMainSurface(surface: MR_DeviceSurface, x: number): DeviceSurface;

  /**
   * Creates and returns all surface elements of an extender device, starting at the provided `x`
   * position.
   */
  createExtenderSurface(surface: MR_DeviceSurface, x: number): DeviceSurface;
}
