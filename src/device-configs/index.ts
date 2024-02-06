import { Except } from "type-fest";
import { JogWheel } from "/decorators/surface-elements/JogWheel";
import { Lamp } from "/decorators/surface-elements/Lamp";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { TouchSensitiveMotorFader } from "/decorators/surface-elements/TouchSensitiveFader";
import { Device } from "/devices";
import { ActivationCallbacks } from "/midi/connection";
import { SegmentDisplayManager } from "/midi/managers/SegmentDisplayManager";
import { GlobalState } from "/state";

type SurfaceElement = LedButton | TouchSensitiveMotorFader | Lamp | JogWheel | MR_Knob;

/**
 * Given a (nested) surface elements object, sets all properties containing a surface element to
 * required.
 */
type RequireAllElements<T> = T extends SurfaceElement
  ? T
  : {
      [K in keyof T]-?: RequireAllElements<T[K]>;
    };

/**
 * Given a (nested) surface elements object, infers an object containing a default element factory
 * function for each optional property
 */
type DefaultElementsFactory<T> = T extends SurfaceElement | SurfaceElement[]
  ? () => T
  : Except<
      {
        [K in keyof T]-?: DefaultElementsFactory<T[K]>;
      },
      {
        [K in keyof T]: undefined extends T[K] ? never : K;
      }[keyof T]
    >;

export interface DeviceSurface {
  width: number;
  channelElements: ChannelSurfaceElements[];
}

export interface MainDeviceSurface extends DeviceSurface {
  controlSectionElements: PartialControlSectionSurfaceElements;
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

export interface PartialControlSectionButtons {
  display?: LedButton;
  timeMode?: LedButton;
  edit?: LedButton;
  flip?: LedButton;
  scrub?: LedButton;

  encoderAssign?: LedButton[];
  number?: LedButton[];
  function?: LedButton[];

  modify?: {
    undo?: LedButton;
    redo?: LedButton;
    save?: LedButton;
    revert?: LedButton;
  };
  automation?: {
    read?: LedButton;
    write?: LedButton;
    sends?: LedButton;
    project?: LedButton;
    mixer?: LedButton;
    motor?: LedButton;
  };
  utility?: {
    instrument?: LedButton;
    main?: LedButton;
    soloDefeat?: LedButton;
    shift?: LedButton;
  };

  transport?: {
    left?: LedButton;
    right?: LedButton;
    cycle?: LedButton;
    punch?: LedButton;

    markers?: {
      previous?: LedButton;
      add?: LedButton;
      next?: LedButton;
    };

    rewind?: LedButton;
    forward?: LedButton;
    stop?: LedButton;
    play?: LedButton;
    record?: LedButton;
  };

  navigation?: {
    bank: {
      left: LedButton;
      right: LedButton;
    };
    channel: {
      left: LedButton;
      right: LedButton;
    };
    directions?: {
      left?: LedButton;
      right?: LedButton;
      up?: LedButton;
      center?: LedButton;
      down?: LedButton;
    };
  };
}

export type ControlSectionButtons = RequireAllElements<PartialControlSectionButtons>;

export interface PartialControlSectionSurfaceElements {
  mainFader: TouchSensitiveMotorFader;
  jogWheel: JogWheel;
  buttons?: PartialControlSectionButtons;

  displayLeds?: {
    smpte?: Lamp;
    beats?: Lamp;
    solo?: Lamp;
  };

  expressionPedal?: MR_Knob;
  footSwitches: MR_Button[];
}

export type ControlSectionSurfaceElements =
  RequireAllElements<PartialControlSectionSurfaceElements>;

export type ControlSectionSurfaceElementsDefaultsFactory =
  DefaultElementsFactory<PartialControlSectionSurfaceElements>;

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
  createMainSurface(surface: MR_DeviceSurface, x: number): MainDeviceSurface;

  /**
   * Creates and returns all surface elements of an extender device, starting at the provided `x`
   * position.
   */
  createExtenderSurface(surface: MR_DeviceSurface, x: number): DeviceSurface;

  enhanceMapping?(mappingDependencies: {
    driver: MR_DeviceDriver;
    page: MR_FactoryMappingPage;
    devices: Device[];
    segmentDisplayManager: SegmentDisplayManager;
    globalState: GlobalState;
    activationCallbacks: ActivationCallbacks;
  }): void;
}
