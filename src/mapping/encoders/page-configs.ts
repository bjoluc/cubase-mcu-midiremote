import { mDefaults } from "midiremote_api_v1";
import { EncoderMappingConfig } from "./EncoderMapper";
import { EncoderAssignmentConfig, EncoderPageConfig } from "./EncoderPage";
import { config } from "/config";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { EncoderDisplayMode } from "/decorators/surface-elements/LedPushEncoder";
import { MainDevice } from "/devices";
import { createElements } from "/util";

const sendSlotsCount = mDefaults.getNumberOfSendSlots();

export const pan: EncoderPageConfig = {
  name: "Pan",
  assignments: (mixerBankChannel) => ({
    displayMode: EncoderDisplayMode.BoostOrCut,
    encoderValue: mixerBankChannel.mValue.mPan,
    encoderValueDefault: 0.5,
    pushToggleValue: mixerBankChannel.mValue.mMonitorEnable,
    onPush: config.resetPanOnEncoderPush
      ? (context, encoder) => {
          encoder.mEncoderValue.setProcessValue(context, 0.5);
        }
      : undefined,
  }),
  areAssignmentsChannelRelated: true,
};

export const monitor: EncoderPageConfig = {
  name: "Monitor",
  assignments: (mixerBankChannel) => ({
    displayMode: EncoderDisplayMode.Wrap,
    encoderValue: mixerBankChannel.mValue.mMonitorEnable,
    encoderValueDefault: 0,
    pushToggleValue: mixerBankChannel.mValue.mMonitorEnable,
  }),
  areAssignmentsChannelRelated: true,
};

export const inputGain: EncoderPageConfig = {
  name: "Input Gain",
  assignments: (mixerBankChannel) => ({
    displayMode: EncoderDisplayMode.BoostOrCut,
    encoderValue: mixerBankChannel.mPreFilter.mGain,
    encoderValueDefault: 0.5,
  }),
  areAssignmentsChannelRelated: true,
};

export const inputPhase: EncoderPageConfig = {
  name: "Input Phase",
  assignments: (mixerBankChannel) => ({
    displayMode: EncoderDisplayMode.Wrap,
    encoderValue: mixerBankChannel.mPreFilter.mPhaseSwitch,
    encoderValueDefault: 0,
  }),
  areAssignmentsChannelRelated: true,
};

export const lowCut: EncoderPageConfig = {
  name: "Low Cut",
  assignments: (mixerBankChannel) => ({
    displayMode: EncoderDisplayMode.Wrap,
    encoderValue: mixerBankChannel.mPreFilter.mLowCutFreq,
    encoderValueDefault: 0,
    pushToggleValue: mixerBankChannel.mPreFilter.mLowCutOn,
  }),
  areAssignmentsChannelRelated: true,
};

export const highCut: EncoderPageConfig = {
  name: "High Cut",
  assignments: (mixerBankChannel) => ({
    displayMode: EncoderDisplayMode.Wrap,
    encoderValue: mixerBankChannel.mPreFilter.mHighCutFreq,
    encoderValueDefault: 1,
    pushToggleValue: mixerBankChannel.mPreFilter.mHighCutOn,
  }),
  areAssignmentsChannelRelated: true,
};

export const trackQuickControls = (hostAccess: MR_HostAccess): EncoderPageConfig => ({
  name: "Track Quick Controls",
  assignments: (mixerBankChannel, channelIndex) => {
    return {
      encoderValue:
        hostAccess.mTrackSelection.mMixerChannel.mQuickControls.getByIndex(channelIndex),
      displayMode: EncoderDisplayMode.SingleDot,
    };
  },
  areAssignmentsChannelRelated: false,
});

export const eq = (hostAccess: MR_HostAccess): EncoderPageConfig => {
  const mChannelEQ = hostAccess.mTrackSelection.mMixerChannel.mChannelEQ;

  return {
    name: "EQ",
    assignments: [
      mChannelEQ.mBand1,
      mChannelEQ.mBand2,
      mChannelEQ.mBand3,
      mChannelEQ.mBand4,
    ].flatMap<EncoderAssignmentConfig>((band, bandIndex) => [
      {
        displayMode: EncoderDisplayMode.SingleDot,
        encoderValue: band.mFreq,
        encoderValueDefault: [
          0.2810622751712799, 0.47443774342536926, 0.5877489447593689, 0.889056384563446,
        ][bandIndex],
        pushToggleValue: band.mOn,
      },
      {
        displayMode: EncoderDisplayMode.BoostOrCut,
        encoderValue: band.mGain,
        pushToggleValue: band.mOn,
        onShiftPush: (context, encoder) => {
          encoder.mEncoderValue.setProcessValue(
            context,
            1 - encoder.mEncoderValue.getProcessValue(context),
          );
        },
      },
      {
        displayMode: EncoderDisplayMode.SingleDot,
        encoderValue: band.mQ,
        pushToggleValue: band.mOn,
        encoderValueDefault: 0.0833333358168602,
      },
      {
        displayMode: EncoderDisplayMode.SingleDot,
        encoderValue: band.mFilterType,
        pushToggleValue: band.mOn,
        encoderValueDefault: [0.7142857313156128, 1, 1, 0.7142857313156128][bandIndex],
      },
    ]),
    areAssignmentsChannelRelated: false,
  };
};

export const sends = (hostAccess: MR_HostAccess): EncoderPageConfig => {
  const mSends = hostAccess.mTrackSelection.mMixerChannel.mSends;

  return {
    name: "Sends",
    assignments: [
      ...createElements<EncoderAssignmentConfig>(sendSlotsCount, (slotIndex) => {
        const sendSlot = mSends.getByIndex(slotIndex);
        return {
          encoderValue: sendSlot.mLevel,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValueDefault: 0.7890865802764893,
          pushToggleValue: sendSlot.mOn,
        };
      }),
      ...createElements<EncoderAssignmentConfig>(sendSlotsCount, (slotIndex) => {
        const sendSlot = mSends.getByIndex(slotIndex);
        return {
          encoderValue: sendSlot.mPrePost,
          displayMode: EncoderDisplayMode.Wrap,
          encoderValueDefault: 0,
          pushToggleValue: sendSlot.mPrePost,
        };
      }),
    ],
    areAssignmentsChannelRelated: false,
  };
};

export const vstQuickControls = (hostAccess: MR_HostAccess): EncoderPageConfig => ({
  name: "VST Quick Controls",
  assignments: () => {
    return {
      encoderValue:
        hostAccess.mTrackSelection.mMixerChannel.mInstrumentPluginSlot.mParameterBankZone.makeParameterValue(),
      displayMode: EncoderDisplayMode.SingleDot,
    };
  },
  areAssignmentsChannelRelated: false,
});

type StripEffectSlot =
  | MR_HostStripEffectSlotGate
  | MR_HostStripEffectSlotCompressor
  | MR_HostStripEffectSlotTools
  | MR_HostStripEffectSlotSaturator
  | MR_HostStripEffectSlotLimiter;

let stripEffectAssignments: Record<string, EncoderAssignmentConfig[]> | undefined;
const getStripEffectAssignments = (hostAccess: MR_HostAccess) => {
  const createAssignments = (stripEffect: StripEffectSlot) =>
    createElements(8, (): EncoderAssignmentConfig => {
      const parameterValue = stripEffect.mParameterBankZone.makeParameterValue();
      return {
        encoderValue: parameterValue,
        displayMode: EncoderDisplayMode.SingleDot,
        pushToggleValue: stripEffect.mBypass,
      };
    });

  if (!stripEffectAssignments) {
    const stripEffects =
      hostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects.mStripEffects;
    stripEffectAssignments = {
      gate: createAssignments(stripEffects.mGate),
      compressor: createAssignments(stripEffects.mCompressor),
      tools: createAssignments(stripEffects.mTools),
      saturator: createAssignments(stripEffects.mSaturator),
      limiter: createAssignments(stripEffects.mLimiter),
    };
  }

  return stripEffectAssignments;
};

export const stripEffects = (hostAccess: MR_HostAccess): EncoderPageConfig => {
  const stripEffectAssignments = getStripEffectAssignments(hostAccess);

  return {
    name: "Channel Strip",
    assignments: [
      ...stripEffectAssignments.gate,
      ...stripEffectAssignments.compressor,
      ...stripEffectAssignments.tools,
      ...stripEffectAssignments.saturator,
      ...stripEffectAssignments.limiter,
    ],
    areAssignmentsChannelRelated: false,
  };
};

const makeStripEffectEncoderPageConfig = (
  name: string,
  assignments: EncoderAssignmentConfig[],
): EncoderPageConfig => {
  return {
    name,
    assignments,
    areAssignmentsChannelRelated: false,
  };
};

export const stripEffectGate = (hostAccess: MR_HostAccess) =>
  makeStripEffectEncoderPageConfig("Gate", getStripEffectAssignments(hostAccess)["gate"]);

export const stripEffectCompressor = (hostAccess: MR_HostAccess) =>
  makeStripEffectEncoderPageConfig(
    "Compressor",
    getStripEffectAssignments(hostAccess)["compressor"],
  );

export const stripEffectTools = (hostAccess: MR_HostAccess) =>
  makeStripEffectEncoderPageConfig("Tools", getStripEffectAssignments(hostAccess)["tools"]);

export const stripEffectSaturator = (hostAccess: MR_HostAccess) =>
  makeStripEffectEncoderPageConfig("Saturator", getStripEffectAssignments(hostAccess)["saturator"]);

export const stripEffectLimiter = (hostAccess: MR_HostAccess) =>
  makeStripEffectEncoderPageConfig("Limiter", getStripEffectAssignments(hostAccess)["limiter"]);

export const focusedInsertEffect = (hostAccess: MR_HostAccess): EncoderPageConfig => {
  const insertEffectsViewer = hostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
    .makeInsertEffectViewer("Inserts")
    .followPluginWindowInFocus();
  const parameterBankZone = insertEffectsViewer.mParameterBankZone;

  return {
    name: "Plugin",
    assignments: () => {
      const parameterValue = parameterBankZone.makeParameterValue();
      return {
        encoderValue: parameterValue,
        displayMode: EncoderDisplayMode.SingleDot,
      };
    },
    areAssignmentsChannelRelated: false,

    enhanceMapping(encoderPage, pageGroup, { page, mainDevices, globalState }) {
      const subPages = encoderPage.subPages;
      const actions = parameterBankZone.mAction;

      for (const button of pageGroup.activatorButtons) {
        for (const subPage of [subPages.default, subPages.flip]) {
          page.makeActionBinding(button.mSurfaceValue, actions.mNextBank).setSubPage(subPage);
        }
      }

      // Map channel navigation buttons to parameter bank navigation
      for (const device of mainDevices) {
        const channelButtons = device.controlSectionElements.buttons.navigation.channel;

        for (const subPage of [subPages.defaultShift, subPages.flipShift]) {
          page
            .makeActionBinding(channelButtons.left.mSurfaceValue, actions.mPrevBank)
            .setSubPage(subPage);
          page
            .makeActionBinding(channelButtons.right.mSurfaceValue, actions.mNextBank)
            .setSubPage(subPage);
        }

        // Light up navigation buttons in shift mode
        globalState.isShiftModeActive.addOnChangeCallback((context, isShiftModeActive) => {
          if (encoderPage.isActive.get(context)) {
            channelButtons.left.setLedValue(context, +isShiftModeActive);
            channelButtons.right.setLedValue(context, +isShiftModeActive);
          }
        });
      }
    },
  };
};

export const focusedQuickControls = (hostAccess: MR_HostAccess): EncoderPageConfig => ({
  name: "Focused Quick Controls",
  assignments: (_mixerChannel, channelIndex) => {
    return {
      encoderValue: hostAccess.mFocusedQuickControls.getByIndex(channelIndex),
      displayMode: EncoderDisplayMode.SingleDot,
    };
  },
  areAssignmentsChannelRelated: false,
});

export const sendSlot = (slotId: number): EncoderPageConfig => ({
  name: "Send Slot",
  assignments: (channel) => {
    const sendSlot = channel.mSends.getByIndex(slotId);

    return {
      encoderValue: sendSlot.mLevel,
      encoderValueName: `Send ${slotId + 1}`,
      displayMode: EncoderDisplayMode.Wrap,
      encoderValueDefault: 0.7890865802764893,
      pushToggleValue: sendSlot.mOn,
    };
  },
  areAssignmentsChannelRelated: true,
});
