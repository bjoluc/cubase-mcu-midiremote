import {
  ControlSectionSurfaceElements,
  ControlSectionSurfaceElementsDefaultsFactory,
  PartialControlSectionSurfaceElements,
} from "../device-configs";
import { Device } from "./Device";
import { deviceConfig } from "/config";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { GlobalState } from "/state";
import { TimerUtils, applyDefaultsFactory, createElements } from "/util";

export class MainDevice extends Device {
  controlSectionElements: ControlSectionSurfaceElements;

  constructor(
    driver: MR_DeviceDriver,
    surface: MR_DeviceSurface,
    globalState: GlobalState,
    timerUtils: TimerUtils,
    firstChannelIndex: number,
    surfaceXPosition: number,
  ) {
    const deviceSurface = deviceConfig.createMainSurface(surface, surfaceXPosition);
    super(driver, firstChannelIndex, deviceSurface, globalState, timerUtils, false);

    this.controlSectionElements = this.applyControlSectionElementDefaults(
      surface,
      deviceSurface.controlSectionElements,
    );
  }

  /**
   * Adds hidden surface elements for all optional control section elements that have been left
   * undefined
   */
  private applyControlSectionElementDefaults(
    surface: MR_DeviceSurface,
    elements: PartialControlSectionSurfaceElements,
  ): ControlSectionSurfaceElements {
    const makeButton = () => new LedButton(surface);
    const defaultsFactory: ControlSectionSurfaceElementsDefaultsFactory = {
      buttons: {
        display: makeButton,
        timeMode: makeButton,
        edit: makeButton,
        flip: makeButton,
        scrub: makeButton,

        encoderAssign: () => createElements(6, () => new LedButton(surface)),
        number: () => createElements(8, () => new LedButton(surface)),
        function: () => createElements(8, () => new LedButton(surface)),

        modify: {
          undo: makeButton,
          redo: makeButton,
          save: makeButton,
          revert: makeButton,
        },
        automation: {
          read: makeButton,
          write: makeButton,
          sends: makeButton,
          project: makeButton,
          mixer: makeButton,
          motor: makeButton,
        },
        utility: {
          instrument: makeButton,
          main: makeButton,
          soloDefeat: makeButton,
          shift: makeButton,
        },

        transport: {
          left: makeButton,
          right: makeButton,
          cycle: makeButton,
          punch: makeButton,

          markers: {
            previous: makeButton,
            add: makeButton,
            next: makeButton,
          },

          rewind: makeButton,
          forward: makeButton,
          stop: makeButton,
          play: makeButton,
          record: makeButton,
        },

        navigation: {
          bank: {
            left: makeButton,
            right: makeButton,
          },
          channel: {
            left: makeButton,
            right: makeButton,
          },
          directions: {
            left: makeButton,
            right: makeButton,
            up: makeButton,
            center: makeButton,
            down: makeButton,
          },
        },
      },

      expressionPedal: () =>
        ({
          mSurfaceValue: surface.makeCustomValueVariable("ExpressionPedal"),
        }) as MR_Knob,
    };

    return applyDefaultsFactory(elements, defaultsFactory);
  }
}
