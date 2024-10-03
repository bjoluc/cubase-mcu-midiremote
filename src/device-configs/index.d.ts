import { Class, Except, SetRequired } from "type-fest";
import { JogWheel } from "/decorators/surface-elements/JogWheel";
import { Lamp } from "/decorators/surface-elements/Lamp";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { TouchSensitiveMotorFader } from "/decorators/surface-elements/TouchSensitiveFader";
import { Device, MainDevice } from "/devices";
import { EncoderMappingConfig } from "/mapping/encoders/EncoderMapper";
import { SegmentDisplayManager } from "/midi/managers/SegmentDisplayManager";
import { ColorManager } from "/midi/managers/colors/ColorManager";
import { GlobalState } from "/state";
import { LifecycleCallbacks } from "/util";

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

export interface MainDeviceSurface<MainDeviceCustomElements extends Record<string, any> = {}>
  extends DeviceSurface {
  controlSectionElements: PartialControlSectionSurfaceElements;
  customElements?: MainDeviceCustomElements;
}

export interface ChannelSurfaceElements {
  index: number;
  encoder: LedPushEncoder;
  scribbleStrip: {
    trackTitle: MR_SurfaceCustomValueVariable;

    /**
     * An optional custom value variable to show meter peak levels on devices with secondary
     * scribble strips
     **/
    meterPeakLevel?: MR_SurfaceCustomValueVariable;
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

  encoderAssign?: {
    track?: LedButton;
    pan?: LedButton;
    eq?: LedButton;
    send?: LedButton;
    plugin?: LedButton;
    instrument?: LedButton;
  };

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
    bank?: {
      left?: LedButton;
      right?: LedButton;
    };
    channel?: {
      left?: LedButton;
      right?: LedButton;
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

interface PartialDisplayLeds {
  smpte?: Lamp;
  beats?: Lamp;
  solo?: Lamp;
}

type DispalyLeds = RequireAllElements<PartialDisplayLeds>;

export interface PartialControlSectionSurfaceElements {
  mainFader: TouchSensitiveMotorFader;
  mainVuMeters?: {
    left: MR_SurfaceCustomValueVariable;
    right: MR_SurfaceCustomValueVariable;
  };

  jogWheel: JogWheel;
  buttons?: PartialControlSectionButtons;

  displayLeds?: PartialDisplayLEDs;

  expressionPedal?: MR_Knob;
  footSwitch1?: MR_Button;
  footSwitch2?: MR_Button;
}

export interface ControlSectionSurfaceElements
  extends SetRequired<
    PartialControlSectionSurfaceElements,
    "expressionPedal" | "footSwitch1" | "footSwitch2"
  > {
  buttons: RequireAllElements<PartialControlSectionButtons>;
  displayLeds: RequireAllElements<PartialDisplayLeds>;
}

export type ControlSectionSurfaceElementsDefaultsFactory = DefaultElementsFactory<
  Except<PartialControlSectionSurfaceElements, "mainVuMeters">
>;

export interface DeviceConfig {
  colorManager?: Class<ColorManager>;

  /**
   * If the maximum meter value (sent on clip) should deviate from the default (0xe), specify it
   * here.
   */
  maximumMeterValue?: number;

  /**
   * Whether the device has per-channel scribble strip displays, i.e. no display padding characters
   * are needed between channels.
   *
   * @default false
   */
  hasIndividualScribbleStrips?: boolean;

  /**
   * Whether the device has additional secondary scribble strip displays.
   *
   * @default false
   */
  hasSecondaryScribbleStrips?: boolean;

  /**
   * Whether all encoders shall be mapped in mouse value control mode. This option is intended for
   * devices with only one physical channel.
   *
   * @default false
   */
  shallMouseValueModeMapAllEncoders?: boolean;

  detectionUnits: Array<{
    /**
     * A function that configures a `MR_DetectionPortPair` with main device input and output port
     * name detection rules.
     */
    main: (detectionPortPair: MR_DetectionPortPair) => void;

    /**
     * A function that configures a `MR_DetectionPortPair` with extender input and output port name
     * detection rules.
     *
     * @param detectionPortPair The port pair to be configured
     * @param extenderNumber The number of the extender to configure the port pair for, starting at 1
     */
    extender: (detectionPortPair: MR_DetectionPortPair, extenderNumber: number) => void;
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
  createExtenderSurface?(surface: MR_DeviceSurface, x: number): DeviceSurface;

  /**
   * In case a main device has no Shift button or more than one Shift button is required, this
   * optional function can be used to configure supplementary Shift buttons. It is invoked with a
   * `MainDevice` and returns a list of `LedButton`s of that device. Every button in that list will
   * be mapped as an additional Shift button.
   */
  getSupplementaryShiftButtons?(device: MainDevice): LedButton[];

  /**
   * If another button than "Sends" should toggle mouse value control mode, return it from this
   * optional function.
   */
  getMouseValueModeButton?(device: MainDevice): LedButton;

  /**
   * This optional function receives the default list of {@link EncoderMappingConfig}s and returns a
   * list of `EncoderMappingConfig`s that will be applied instead of the default.
   *
   * The default mappings are defined in {@link file://./../mapping/encoders/index.ts}
   */
  configureEncoderMappings?(
    defaultEncoderMappings: EncoderMappingConfig[],
    page: MR_FactoryMappingPage,
  ): EncoderMappingConfig[];

  enhanceMapping?(mappingDependencies: {
    driver: MR_DeviceDriver;
    page: MR_FactoryMappingPage;
    devices: Device[];
    segmentDisplayManager: SegmentDisplayManager;
    globalState: GlobalState;
    lifecycleCallbacks: LifecycleCallbacks;
  }): void;
}
