// @ts-expect-error No type defs available
import abbreviate from "abbreviate";
import { EncoderParameterNameBuilder } from ".";
import { LcdManager } from "./LcdManager";
import { deviceConfig } from "/config";
import { GlobalState } from "/state";
import { ContextVariable, TimerUtils } from "/util";

const enum LocalValueDisplayMode {
  Disabled,
  EncoderValue,
  PushValue,
}

/**
 * Handles the LCD display text of a single channel
 */
export class ChannelTextManager {
  private static readonly channelWidth = deviceConfig.hasIndividualScribbleStrips ? 7 : 6;

  private static readonly defaultParameterNameBuilder: EncoderParameterNameBuilder = (
    title1,
    title2,
  ) => title2;

  private static nextManagerId = 0;

  /**
   * Strips any non-ASCII character from the provided string, since devices only support ASCII.
   **/
  private static stripNonAsciiCharacters(input: string) {
    return input.replace(/[^\x00-\x7F]/g, "");
  }

  /**
   * Given a <= `ChannelTextManager.channelWidth` characters long string, returns a left-padded
   * version of it that appears centered on an `ChannelTextManager.channelWidth`-character display.
   */
  private static centerString(input: string, width = ChannelTextManager.channelWidth) {
    if (input.length >= width) {
      return input;
    }

    return LcdManager.makeSpaces(Math.floor((width - input.length) / 2)) + input;
  }

  /**
   * Given a string, returns an abbreviated version of it consisting of at most
   * `LcdManager.channelWidth` characters.
   */
  private static abbreviateString(input: string) {
    if (input.length < ChannelTextManager.channelWidth) {
      return input;
    }

    return abbreviate(input, { length: ChannelTextManager.channelWidth });
  }

  private static translateParameterName(parameterName: string) {
    return (
      {
        // English
        "Pan Left-Right": "Pan",

        // German
        "Pan links/rechts": "Pan",

        // Spanish
        "Pan izquierda-derecha": "Pan",

        // French
        "Pan gauche-droit": "Pan",
        "Pré/Post": "PrePost",

        // Italian
        "Pan sinistra-destra": "Pan",
        Monitoraggio: "Monitor",

        // Japanese
        左右パン: "Pan",
        モニタリング: "Monitor",
        レベル: "Level",

        // Portuguese
        "Pan Esquerda-Direita": "Pan",
        Nível: "Nivel",
        "Pré/Pós": "PrePost",

        // Russian
        "Панорама Лево-Право": "Pan",
        Монитор: "Monitor",
        Уровень: "Level",
        "Пре/Пост": "PrePost",

        // Chinese
        "声像 左-右": "Pan",
        监听: "Monitor",
        电平: "Level",
        "前置/后置": "PrePost",
      }[parameterName] ?? parameterName
    );
  }

  private static translateParameterValue(parameterValue: string) {
    return (
      {
        // French
        Éteint: "Eteint",

        // Japanese
        オン: "On",
        オフ: "Off",

        // Russian
        "Вкл.": "On",
        "Выкл.": "Off",

        // Chinese
        开: "On",
        关: "Off",
      }[parameterValue] ?? parameterValue
    );
  }

  /** A unique number for each `ChannelTextManager` so it can set uniquely identified timeouts */
  private uniqueManagerId = ChannelTextManager.nextManagerId++;

  /** An ID string to uniquely identify the timeouts set by this `ChannelTextManager` */
  private timeoutId = `updateDisplay${this.uniqueManagerId}`;

  private parameterName = new ContextVariable("");
  private parameterNameBuilder = ChannelTextManager.defaultParameterNameBuilder;
  private parameterValue = new ContextVariable("");
  private lastParameterValueChangeTime = 0;

  /** The time at which the parameter (not its value) controlled by the encoder last changed */
  private lastParameterChangeTime = 0;

  private pushParameterValue = new ContextVariable("");
  private pushParameterValueRaw = new ContextVariable("");
  private pushParameterValuePrefix = "";

  private localValueDisplayMode = new ContextVariable(LocalValueDisplayMode.Disabled);

  private channelName = new ContextVariable("");

  private meterPeakLevel = new ContextVariable("");
  private faderParameterValue = new ContextVariable("");
  private faderParameterName = new ContextVariable("");
  private isFaderTouched = new ContextVariable(false);
  private isFaderParameterDisplayed = new ContextVariable(false);

  /** Whether the parameter controlled by the channel's encoder belongs to that channel */
  public isParameterChannelRelated = true;

  constructor(
    private globalState: GlobalState,
    private timerUtils: TimerUtils,
    private sendText: (context: MR_ActiveDevice, row: number, text: string) => void,
  ) {
    globalState.isValueDisplayModeActive.addOnChangeCallback(
      this.updateNameValueDisplay.bind(this),
    );
    globalState.areDisplayRowsFlipped.addOnChangeCallback(this.updateNameValueDisplay.bind(this));
    globalState.areDisplayRowsFlipped.addOnChangeCallback(this.updateTrackTitleDisplay.bind(this));
    globalState.selectedTrackName.addOnChangeCallback(this.onSelectedTrackChange.bind(this));

    if (deviceConfig.hasSecondaryScribbleStrips) {
      globalState.isShiftModeActive.addOnChangeCallback(
        this.updateIsFaderParameterDisplayed.bind(this),
      );
    }

    if (DEVICE_NAME === "MCU Pro") {
      // Handle metering mode changes
      globalState.isGlobalLcdMeterModeVertical.addOnChangeCallback(
        (context, isMeterModeVertical) => {
          // Update the upper display row before leaving vertical metering mode
          if (!isMeterModeVertical) {
            (globalState.areDisplayRowsFlipped.get(context)
              ? this.updateTrackTitleDisplay.bind(this)
              : this.updateNameValueDisplay.bind(this))(context);
          }
        },
      );

      globalState.areChannelMetersEnabled.addOnChangeCallback((context, areMetersEnabled) => {
        // Update the lower display row after disabling channel meters
        if (!areMetersEnabled) {
          (globalState.areDisplayRowsFlipped.get(context)
            ? this.updateNameValueDisplay.bind(this)
            : this.updateTrackTitleDisplay.bind(this))(context);
        }
      });
    }
  }

  private enableLocalValueDisplayMode(
    context: MR_ActiveDevice,
    mode: LocalValueDisplayMode.EncoderValue | LocalValueDisplayMode.PushValue,
  ) {
    this.localValueDisplayMode.set(context, mode);
    this.updateNameValueDisplay(context);

    this.timerUtils.setTimeout(
      context,
      this.timeoutId,
      this.disableLocalValueDisplayMode.bind(this),
      1,
    );
  }

  private disableLocalValueDisplayMode(context: MR_ActiveDevice) {
    if (this.localValueDisplayMode.get(context) !== LocalValueDisplayMode.Disabled) {
      this.localValueDisplayMode.set(context, LocalValueDisplayMode.Disabled);
      this.timerUtils.clearTimeout(this.timeoutId);
      this.updateNameValueDisplay(context);
    }
  }

  private updateNameValueDisplay(context: MR_ActiveDevice) {
    const row = +this.globalState.areDisplayRowsFlipped.get(context);

    // Skip updating the lower display row on MCU Pro when horizontal metering mode is enabled
    if (
      DEVICE_NAME === "MCU Pro" &&
      row === 1 &&
      this.globalState.areChannelMetersEnabled.get(context) &&
      !this.globalState.isGlobalLcdMeterModeVertical.get(context)
    ) {
      return;
    }

    const localValueDisplayMode = this.localValueDisplayMode.get(context);

    this.sendText(
      context,
      row,
      localValueDisplayMode === LocalValueDisplayMode.PushValue
        ? this.pushParameterValue.get(context)
        : localValueDisplayMode === LocalValueDisplayMode.EncoderValue ||
            this.globalState.isValueDisplayModeActive.get(context)
          ? this.parameterValue.get(context)
          : this.parameterName.get(context),
    );
  }

  private updateTrackTitleDisplay(context: MR_ActiveDevice) {
    const row = 1 - +this.globalState.areDisplayRowsFlipped.get(context);

    // Skip updating the lower display row on MCU Pro when horizontal metering mode is enabled
    if (
      DEVICE_NAME === "MCU Pro" &&
      row === 1 &&
      this.globalState.areChannelMetersEnabled.get(context) &&
      !this.globalState.isGlobalLcdMeterModeVertical.get(context)
    ) {
      return;
    }

    this.sendText(context, row, this.channelName.get(context));
    this.updateSecondaryTrackTitleDisplay(context);
  }

  /**
   * Updates the track title displayed on the first row of the channel's secondary display, if the
   * device has secondary displays.
   */
  private updateSecondaryTrackTitleDisplay(context: MR_ActiveDevice) {
    if (deviceConfig.hasSecondaryScribbleStrips) {
      this.sendText(
        context,
        2,
        ChannelTextManager.centerString(
          this.isFaderParameterDisplayed.get(context)
            ? this.faderParameterName.get(context)
            : this.channelName.get(context),
        ),
      );
    }
  }

  private updateIsFaderParameterDisplayed(context: MR_ActiveDevice) {
    const previousValue = this.isFaderParameterDisplayed.get(context);
    const newValue =
      this.isFaderTouched.get(context) && !this.globalState.isShiftModeActive.get(context);

    if (newValue !== previousValue) {
      this.isFaderParameterDisplayed.set(context, newValue);
      this.updateSecondaryTrackTitleDisplay(context);
      this.updateSupplementaryInfo(context);
    }
  }

  /**
   * Updates the string displayed on the second row of the channel's secondary display, if the
   * device has secondary displays.
   */
  private updateSupplementaryInfo(context: MR_ActiveDevice) {
    if (deviceConfig.hasSecondaryScribbleStrips) {
      this.sendText(
        context,
        3,
        ChannelTextManager.centerString(
          ChannelTextManager.abbreviateString(
            this.isFaderParameterDisplayed.get(context)
              ? this.faderParameterValue.get(context)
              : this.meterPeakLevel.get(context),
          ),
        ),
      );
    }
  }

  setParameterNameBuilder(builder?: EncoderParameterNameBuilder) {
    this.parameterNameBuilder = builder ?? ChannelTextManager.defaultParameterNameBuilder;
  }

  setPushParameterValuePrefix(prefix: string = "") {
    this.pushParameterValuePrefix = prefix;
  }

  onParameterTitleChange(context: MR_ActiveDevice, title1: string, title2: string) {
    // Luckily, `onParameterTitleChange` runs after `onParameterDisplayValueChange`, so disabling
    // `localValueDisplayMode` here overwrites the `EncoderValue` mode that
    // `onParameterDisplayValueChange` sets
    this.localValueDisplayMode.set(context, LocalValueDisplayMode.Disabled);

    this.parameterName.set(
      context,
      ChannelTextManager.centerString(
        ChannelTextManager.abbreviateString(
          ChannelTextManager.stripNonAsciiCharacters(
            this.parameterNameBuilder(title1, ChannelTextManager.translateParameterName(title2)),
          ),
        ),
      ),
    );

    this.updateNameValueDisplay(context);
  }

  onParameterDisplayValueChange(context: MR_ActiveDevice, value: string) {
    const now = performance.now();
    this.lastParameterValueChangeTime = now;

    this.parameterValue.set(
      context,
      ChannelTextManager.centerString(
        ChannelTextManager.abbreviateString(
          ChannelTextManager.stripNonAsciiCharacters(
            ChannelTextManager.translateParameterValue(value),
          ),
        ),
      ),
    );

    if (this.globalState.isValueDisplayModeActive.get(context)) {
      this.updateNameValueDisplay(context);
    } else if (now > this.lastParameterChangeTime + 100) {
      this.enableLocalValueDisplayMode(context, LocalValueDisplayMode.EncoderValue);
    }
  }

  onPushParameterDisplayValueChange(context: MR_ActiveDevice, value: string) {
    const lastValue = this.pushParameterValueRaw.get(context);
    this.pushParameterValueRaw.set(context, value);
    const now = performance.now();

    // Avoid reacting to display value changes when they are caused by switching to or from an
    // undefined host value or by switching encoder assignments or tracks (i.e. if this callback
    // runs up to 100 ms after these values were changed).
    if (
      value !== "" &&
      lastValue !== "" &&
      now > this.lastParameterValueChangeTime + 100 &&
      now > this.lastParameterChangeTime + 100
    ) {
      // The only way push parameter values are ever displayed is by calling
      // `enableLocalValueDisplayMode` below. Hence, we only update `this.pushParameterValue` inside
      // the if block.
      this.pushParameterValue.set(
        context,
        ChannelTextManager.centerString(
          ChannelTextManager.abbreviateString(
            this.pushParameterValuePrefix +
              ChannelTextManager.stripNonAsciiCharacters(
                ChannelTextManager.translateParameterValue(value),
              ),
          ),
        ),
      );

      this.enableLocalValueDisplayMode(context, LocalValueDisplayMode.PushValue);
    }
  }

  onChannelNameChange(context: MR_ActiveDevice, name: string) {
    if (this.isParameterChannelRelated) {
      this.onParameterChange(context);
    }

    this.channelName.set(
      context,
      ChannelTextManager.abbreviateString(ChannelTextManager.stripNonAsciiCharacters(name)),
    );
    this.updateTrackTitleDisplay(context);
  }

  onSelectedTrackChange(context: MR_ActiveDevice) {
    if (!this.isParameterChannelRelated) {
      this.onParameterChange(context);
    }
  }

  /** This callback is not called externally, but only from within this class */
  onParameterChange(context: MR_ActiveDevice) {
    this.lastParameterChangeTime = performance.now();
    this.disableLocalValueDisplayMode(context);
  }

  onMeterPeakLevelChange(context: MR_ActiveDevice, level: string) {
    this.meterPeakLevel.set(context, level);
    if (!this.isFaderParameterDisplayed.get(context)) {
      this.updateSupplementaryInfo(context);
    }
  }

  onFaderParameterValueChange(context: MR_ActiveDevice, value: string) {
    this.faderParameterValue.set(context, ChannelTextManager.stripNonAsciiCharacters(value));
    if (this.isFaderParameterDisplayed.get(context)) {
      this.updateSupplementaryInfo(context);
    }
  }

  onFaderParameterNameChange(context: MR_ActiveDevice, name: string) {
    this.faderParameterName.set(
      context,
      ChannelTextManager.abbreviateString(
        ChannelTextManager.stripNonAsciiCharacters(ChannelTextManager.translateParameterName(name)),
      ),
    );

    if (this.isFaderParameterDisplayed.get(context)) {
      this.updateSecondaryTrackTitleDisplay(context);
    }
  }

  onFaderTouchedChange(context: MR_ActiveDevice, isFaderTouched: boolean) {
    this.isFaderTouched.set(context, isFaderTouched);
    this.updateIsFaderParameterDisplayed(context);
  }
}
