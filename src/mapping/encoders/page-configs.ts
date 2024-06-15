import { mDefaults } from "midiremote_api_v1";
import { EncoderAssignmentConfig, EncoderPageConfig } from "./EncoderPage";
import { config } from "/config";
import { EncoderDisplayMode } from "/decorators/surface-elements/LedPushEncoder";
import { createElements } from "/util";

const sendSlotsCount = mDefaults.getNumberOfSendSlots();

export const pan: EncoderPageConfig = {
  name: "Pan",
  assignments: (mixerBankChannel) => ({
    displayMode: EncoderDisplayMode.BoostOrCut,
    encoderParameter: mixerBankChannel.mValue.mPan,
    encoderParameterDefault: 0.5,
    pushToggleParameter: mixerBankChannel.mValue.mMonitorEnable,
    pushToggleParameterPrefix: "Mon ",
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
    encoderParameter: mixerBankChannel.mValue.mMonitorEnable,
    encoderParameterDefault: 0,
    pushToggleParameter: mixerBankChannel.mValue.mMonitorEnable,
  }),
  areAssignmentsChannelRelated: true,
};

export const inputGain: EncoderPageConfig = {
  name: "Input Gain",
  assignments: (mixerBankChannel) => ({
    displayMode: EncoderDisplayMode.BoostOrCut,
    encoderParameter: mixerBankChannel.mPreFilter.mGain,
    encoderParameterDefault: 0.5,
  }),
  areAssignmentsChannelRelated: true,
};

export const inputPhase: EncoderPageConfig = {
  name: "Input Phase",
  assignments: (mixerBankChannel) => ({
    displayMode: EncoderDisplayMode.Wrap,
    encoderParameter: mixerBankChannel.mPreFilter.mPhaseSwitch,
    encoderParameterDefault: 0,
  }),
  areAssignmentsChannelRelated: true,
};

export const lowCut: EncoderPageConfig = {
  name: "Low Cut",
  assignments: (mixerBankChannel) => ({
    displayMode: EncoderDisplayMode.Wrap,
    encoderParameter: mixerBankChannel.mPreFilter.mLowCutFreq,
    encoderParameterDefault: 0,
    pushToggleParameter: mixerBankChannel.mPreFilter.mLowCutOn,
    pushToggleParameterPrefix: "LC ",
  }),
  areAssignmentsChannelRelated: true,
};

export const highCut: EncoderPageConfig = {
  name: "High Cut",
  assignments: (mixerBankChannel) => ({
    displayMode: EncoderDisplayMode.Wrap,
    encoderParameter: mixerBankChannel.mPreFilter.mHighCutFreq,
    encoderParameterDefault: 1,
    pushToggleParameter: mixerBankChannel.mPreFilter.mHighCutOn,
    pushToggleParameterPrefix: "HC ",
  }),
  areAssignmentsChannelRelated: true,
};

export const trackQuickControls = (hostAccess: MR_HostAccess): EncoderPageConfig => ({
  name: "Track Quick Controls",
  assignments: (mixerBankChannel, channelIndex) => {
    return {
      encoderParameter:
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
        encoderParameter: band.mFreq,
        encoderParameterDefault: [
          0.2810622751712799, 0.47443774342536926, 0.5877489447593689, 0.889056384563446,
        ][bandIndex],
        pushToggleParameter: band.mOn,
        pushToggleParameterPrefix: "Bnd ",
      },
      {
        displayMode: EncoderDisplayMode.BoostOrCut,
        encoderParameter: band.mGain,
        onPush: (context, encoder) => {
          encoder.mEncoderValue.setProcessValue(
            context,
            1 - encoder.mEncoderValue.getProcessValue(context),
          );
        },
        encoderParameterDefault: 0.5,
      },
      {
        displayMode: EncoderDisplayMode.SingleDot,
        encoderParameter: band.mQ,
        encoderParameterDefault: 0.0833333358168602,
        pushToggleParameter: band.mOn,
        pushToggleParameterPrefix: "Bnd ",
      },
      {
        displayMode: EncoderDisplayMode.SingleDot,
        encoderParameter: band.mFilterType,
        encoderParameterDefault: [0.7142857313156128, 1, 1, 0.7142857313156128][bandIndex],
        pushToggleParameter: band.mOn,
        pushToggleParameterPrefix: "Bnd ",
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
          encoderParameter: sendSlot.mLevel,
          encoderParameterNameBuilder: (title1, title2) =>
            /^\d$/.test(title1) ? `Send ${title1}` : title1,
          displayMode: EncoderDisplayMode.Wrap,
          encoderParameterDefault: 0.7890865802764893,
          pushToggleParameter: sendSlot.mOn,
        };
      }),
      ...createElements<EncoderAssignmentConfig>(sendSlotsCount, (slotIndex) => {
        const sendSlot = mSends.getByIndex(slotIndex);
        return {
          encoderParameter: sendSlot.mPrePost,
          displayMode: EncoderDisplayMode.Wrap,
          encoderParameterDefault: 0,
          pushToggleParameter: sendSlot.mPrePost,
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
      encoderParameter:
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
        encoderParameter: parameterValue,
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
      encoderParameter: hostAccess.mFocusedQuickControls.getByIndex(channelIndex),
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
      encoderParameter: sendSlot.mLevel,
      encoderParameterNameBuilder: (title1, title2) =>
        /^\d$/.test(title1) ? `Send ${title1}` : title1,
      displayMode: EncoderDisplayMode.Wrap,
      encoderParameterDefault: 0.7890865802764893,
      pushToggleParameter: sendSlot.mOn,
    };
  },
  areAssignmentsChannelRelated: true,
});

export const cueSlot = (slotId: number): EncoderPageConfig => ({
  name: "Cue",
  assignments: (channel) => {
    const cueSlot = channel.mCueSends.getByIndex(slotId);

    return {
      encoderParameter: cueSlot.mLevel,
      encoderParameterNameBuilder: (title1) => title1,
      displayMode: EncoderDisplayMode.Wrap,
      encoderParameterDefault: 0.7890865802764893,
      pushToggleParameter: cueSlot.mOn,
    };
  },
  areAssignmentsChannelRelated: true,
});

export const allAvailableCueSlotPages = createElements(
  mDefaults.getMaxControlRoomCueChannels(),
  cueSlot,
);
