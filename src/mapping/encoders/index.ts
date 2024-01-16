import { mDefaults } from "midiremote_api_v1";
import { EncoderMapper } from "./EncoderMapper";
import { EncoderAssignmentConfig } from "./EncoderPage";
import { config } from "/config";
import { DecoratedFactoryMappingPage } from "/decorators/page";
import { EncoderDisplayMode } from "/decorators/surface-elements/LedPushEncoder";
import { Device, MainDevice } from "/devices";
import { SegmentDisplayManager } from "/midi/managers/SegmentDisplayManager";
import { GlobalState } from "/state";
import { createElements } from "/util";

export function bindEncoders(
  page: DecoratedFactoryMappingPage,
  devices: Device[],
  mixerBankChannels: MR_MixerBankChannel[],
  segmentDisplayManager: SegmentDisplayManager,
  globalState: GlobalState,
) {
  const encoderMapper = new EncoderMapper(
    page,
    devices,
    mixerBankChannels,
    segmentDisplayManager,
    globalState,
  );

  // Defining Pan first so it is activated by default
  encoderMapper.bindEncoderPagesToAssignButton(1, [
    {
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
    },
  ]);

  const mMixerChannel = page.mHostAccess.mTrackSelection.mMixerChannel;
  encoderMapper.bindEncoderPagesToAssignButton(0, [
    {
      name: "Monitor",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.Wrap,
        encoderValue: mixerBankChannel.mValue.mMonitorEnable,
        encoderValueDefault: 0,
        pushToggleValue: mixerBankChannel.mValue.mMonitorEnable,
      }),
      areAssignmentsChannelRelated: true,
    },
    {
      name: "Input Gain",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.BoostOrCut,
        encoderValue: mixerBankChannel.mPreFilter.mGain,
        encoderValueDefault: 0.5,
      }),
      areAssignmentsChannelRelated: true,
    },
    {
      name: "Input Phase",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.Wrap,
        encoderValue: mixerBankChannel.mPreFilter.mPhaseSwitch,
        encoderValueDefault: 0,
      }),
      areAssignmentsChannelRelated: true,
    },
    {
      name: "Low Cut",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.Wrap,
        encoderValue: mixerBankChannel.mPreFilter.mLowCutFreq,
        encoderValueDefault: 0,
        pushToggleValue: mixerBankChannel.mPreFilter.mLowCutOn,
      }),
      areAssignmentsChannelRelated: true,
    },
    {
      name: "High Cut",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.Wrap,
        encoderValue: mixerBankChannel.mPreFilter.mHighCutFreq,
        encoderValueDefault: 1,
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
    },
  ]);

  const mSends = mMixerChannel.mSends;
  const sendSlotsCount = mDefaults.getNumberOfSendSlots();
  encoderMapper.bindEncoderPagesToAssignButton(3, [
    {
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
          parameterBankZone.mAction.mNextBank,
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
