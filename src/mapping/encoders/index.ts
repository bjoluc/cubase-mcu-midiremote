import { mDefaults } from "midiremote_api_v1";
import { DecoratedFactoryMappingPage } from "../../decorators/page";
import { Device, MainDevice } from "../../devices";
import { EncoderDisplayMode, GlobalBooleanVariables } from "../../midi";
import { SegmentDisplayManager } from "../../midi/managers/SegmentDisplayManager";
import { createElements } from "../../util";
import { EncoderMapper } from "./EncoderMapper";

export function bindEncoders(
  page: DecoratedFactoryMappingPage,
  devices: Device[],
  mixerBankChannels: MR_MixerBankChannel[],
  segmentDisplayManager: SegmentDisplayManager,
  globalBooleanVariables: GlobalBooleanVariables
) {
  const encoderMapper = new EncoderMapper(
    page,
    devices,
    mixerBankChannels,
    segmentDisplayManager,
    globalBooleanVariables
  );

  // Defining Pan first so it is activated by default
  encoderMapper.bindEncoderPagesToAssignButton(1, [
    {
      name: "Pan",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.BoostOrCut,
        encoderValue: mixerBankChannel.mValue.mPan,
        pushToggleValue: mixerBankChannel.mValue.mMonitorEnable,
        shiftPushToggleValue: mixerBankChannel.mValue.mSolo,
      }),
      areAssignmentsChannelRelated: true,
    },
  ]);

  const mMixerChannel = page.mHostAccess.mTrackSelection.mMixerChannel;
  encoderMapper.bindEncoderPagesToAssignButton(0, [
    {
      name: "Monitor",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.Wrap,
        encoderValue: mixerBankChannel.mValue.mMonitorEnable,
        pushToggleValue: mixerBankChannel.mValue.mMonitorEnable,
      }),
      areAssignmentsChannelRelated: true,
    },
    {
      name: "Input Gain",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.BoostOrCut,
        encoderValue: mixerBankChannel.mPreFilter.mGain,
      }),
      areAssignmentsChannelRelated: true,
    },
    {
      name: "Input Phase",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.Wrap,
        encoderValue: mixerBankChannel.mPreFilter.mPhaseSwitch,
      }),
      areAssignmentsChannelRelated: true,
    },
    {
      name: "Low Cut",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.Wrap,
        encoderValue: mixerBankChannel.mPreFilter.mLowCutFreq,
        pushToggleValue: mixerBankChannel.mPreFilter.mLowCutOn,
      }),
      areAssignmentsChannelRelated: true,
    },
    {
      name: "High Cut",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.Wrap,
        encoderValue: mixerBankChannel.mPreFilter.mHighCutFreq,
        pushToggleValue: mixerBankChannel.mPreFilter.mHighCutOn,
      }),
      areAssignmentsChannelRelated: true,
    },
    {
      name: "Track Quick Controls",
      assignments: (mixerBankChannel, channelIndex) => {
        return {
          encoderValue: mMixerChannel.mQuickControls.getByIndex(channelIndex),
          displayMode: EncoderDisplayMode.SingleDot,
        };
      },
      areAssignmentsChannelRelated: false,
    },
  ]);

  const mChannelEQ = mMixerChannel.mChannelEQ;
  encoderMapper.bindEncoderPagesToAssignButton(2, [
    {
      name: "EQ",
      assignments: [
        mChannelEQ.mBand1,
        mChannelEQ.mBand2,
        mChannelEQ.mBand3,
        mChannelEQ.mBand4,
      ].flatMap((band) => [
        {
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: band.mFreq,
          pushToggleValue: band.mOn,
        },
        {
          displayMode: EncoderDisplayMode.BoostOrCut,
          encoderValue: band.mGain,
          pushToggleValue: band.mOn,
        },
        {
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: band.mQ,
          pushToggleValue: band.mOn,
        },
        {
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: band.mFilterType,
          pushToggleValue: band.mOn,
        },
      ]),
      areAssignmentsChannelRelated: false,
    },
  ]);

  const mSends = mMixerChannel.mSends;
  const sendSlotsCount = mDefaults.getNumberOfSendSlots();
  encoderMapper.bindEncoderPagesToAssignButton(3, [
    {
      name: "Sends",
      assignments: [
        ...createElements(sendSlotsCount, (slotIndex) => {
          const sendSlot = mSends.getByIndex(slotIndex);
          return {
            encoderValue: sendSlot.mLevel,
            displayMode: EncoderDisplayMode.SingleDot,
            pushToggleValue: sendSlot.mOn,
          };
        }),
        ...createElements(sendSlotsCount, (slotIndex) => {
          const sendSlot = mSends.getByIndex(slotIndex);
          return {
            encoderValue: sendSlot.mPrePost,
            displayMode: EncoderDisplayMode.Wrap,
            pushToggleValue: sendSlot.mPrePost,
          };
        }),
      ],
      areAssignmentsChannelRelated: false,
    },
  ]);

  const effectsViewer = mMixerChannel.mInsertAndStripEffects
    .makeInsertEffectViewer("Inserts")
    .followPluginWindowInFocus();
  const parameterBankZone = effectsViewer.mParameterBankZone;
  const [pluginEncoderPage] = encoderMapper.bindEncoderPagesToAssignButton(4, [
    {
      name: "Plugin",
      assignments: () => {
        const parameterValue = parameterBankZone.makeParameterValue();
        return {
          encoderValue: parameterValue,
          displayMode: EncoderDisplayMode.SingleDot,
        };
      },
      areAssignmentsChannelRelated: false,
    },
  ]);

  const deviceButtons = devices
    .filter((device) => device instanceof MainDevice)
    .map((device) => (device as MainDevice).controlSectionElements.buttons);

  for (const buttons of deviceButtons) {
    for (const subPage of [pluginEncoderPage.subPages.default, pluginEncoderPage.subPages.flip]) {
      page
        .makeActionBinding(
          buttons.encoderAssign[4].mSurfaceValue,
          parameterBankZone.mAction.mNextBank
        )
        .setSubPage(subPage);
    }
  }

  const mStripEffects = mMixerChannel.mInsertAndStripEffects.mStripEffects;
  encoderMapper.bindEncoderPagesToAssignButton(5, [
    {
      name: "VST Quick Controls",
      assignments: () => {
        return {
          encoderValue: mMixerChannel.mInstrumentPluginSlot.mParameterBankZone.makeParameterValue(),
          displayMode: EncoderDisplayMode.SingleDot,
        };
      },
      areAssignmentsChannelRelated: false,
    },
    {
      name: "Channel Strip",
      assignments: [
        mStripEffects.mGate,
        mStripEffects.mCompressor,
        mStripEffects.mTools,
        mStripEffects.mSaturator,
        mStripEffects.mLimiter,
      ].flatMap((stripEffect) => {
        return createElements(8, () => {
          const parameterValue = stripEffect.mParameterBankZone.makeParameterValue();
          return {
            encoderValue: parameterValue,
            displayMode: EncoderDisplayMode.SingleDot,
            pushToggleValue: stripEffect.mBypass,
          };
        });
      }),
      areAssignmentsChannelRelated: false,
    },
  ]);
}
