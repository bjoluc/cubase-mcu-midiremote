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

const makeStripEffectAssignments = (stripEffect: StripEffectSlot) => {
  return createElements(8, () => {
    const parameterValue = stripEffect.mParameterBankZone.makeParameterValue();
    return {
      encoderValue: parameterValue,
      displayMode: EncoderDisplayMode.SingleDot,
      pushToggleValue: stripEffect.mBypass,
    };
  });
};

export const stripEffects = (hostAccess: MR_HostAccess): EncoderPageConfig => {
  const mStripEffects =
    hostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects.mStripEffects;

  return {
    name: "Channel Strip",
    assignments: [
      mStripEffects.mGate,
      mStripEffects.mCompressor,
      mStripEffects.mTools,
      mStripEffects.mSaturator,
      mStripEffects.mLimiter,
    ].flatMap(makeStripEffectAssignments),
    areAssignmentsChannelRelated: false,
  };
};

const makeStripEffectEncoderPageConfig = (
  name: string,
  stripEffect: StripEffectSlot,
): EncoderPageConfig => {
  return {
    name,
    assignments: makeStripEffectAssignments(stripEffect),
    areAssignmentsChannelRelated: false,
  };
};

export const stripEffectGate = (hostAccess: MR_HostAccess) =>
  makeStripEffectEncoderPageConfig(
    "Gate",
    hostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects.mStripEffects.mGate,
  );

export const stripEffectCompressor = (hostAccess: MR_HostAccess) =>
  makeStripEffectEncoderPageConfig(
    "Compressor",
    hostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects.mStripEffects.mCompressor,
  );

export const stripEffectTools = (hostAccess: MR_HostAccess) =>
  makeStripEffectEncoderPageConfig(
    "Tools",
    hostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects.mStripEffects.mTools,
  );

export const stripEffectSaturator = (hostAccess: MR_HostAccess) =>
  makeStripEffectEncoderPageConfig(
    "Saturator",
    hostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects.mStripEffects.mSaturator,
  );

export const stripEffectLimiter = (hostAccess: MR_HostAccess) =>
  makeStripEffectEncoderPageConfig(
    "Limiter",
    hostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects.mStripEffects.mLimiter,
  );

/**
 * Not a page config, I know. But I'd like to make it a page config in the future (the
 * `enhanceMapping` logic is currently preventing this).
 **/
export const pluginMappingConfig = (
  page: MR_FactoryMappingPage,
  activatorButtonSelector: (device: MainDevice) => LedButton,
): EncoderMappingConfig => {
  const insertEffectsViewer = page.mHostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
    .makeInsertEffectViewer("Inserts")
    .followPluginWindowInFocus();

  return {
    activatorButtonSelector,
    pages: [
      {
        name: "Plugin",
        assignments: () => {
          const parameterValue = insertEffectsViewer.mParameterBankZone.makeParameterValue();
          return {
            encoderValue: parameterValue,
            displayMode: EncoderDisplayMode.SingleDot,
          };
        },
        areAssignmentsChannelRelated: false,
      },
    ],
    enhanceMapping: ([pluginEncoderPage], activatorButtons) => {
      for (const button of activatorButtons) {
        for (const subPage of [
          pluginEncoderPage.subPages.default,
          pluginEncoderPage.subPages.flip,
        ]) {
          page
            .makeActionBinding(
              button.mSurfaceValue,
              insertEffectsViewer.mParameterBankZone.mAction.mNextBank,
            )
            .setSubPage(subPage);
        }
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
