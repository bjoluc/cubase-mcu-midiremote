import { mDefaults } from "midiremote_api_v1";
import { SegmentDisplayManager } from "src/midi/managers/SegmentDisplayManager";
import { config } from "../config";
import { DecoratedFactoryMappingPage } from "../decorators/page";
import { Device, MainDevice } from "../devices";
import { EncoderDisplayMode, GlobalBooleanVariables } from "../midi";
import { createElements, makeCallbackCollection } from "../util";

export interface EncoderAssignment {
  encoderValue: MR_HostValue;
  displayMode: EncoderDisplayMode;
  pushToggleValue?: MR_HostValue;
}

export type EncoderAssignments =
  | EncoderAssignment[]
  | ((channel: MR_MixerBankChannel, channelIndex: number) => EncoderAssignment);

export interface EncoderPage {
  name?: string;
  assignments: EncoderAssignments;
  areAssignmentsChannelRelated: boolean;
}

export function bindEncoders(
  page: DecoratedFactoryMappingPage,
  devices: Device[],
  mixerBankChannels: MR_MixerBankChannel[],
  segmentDisplayManager: SegmentDisplayManager,
  globalBooleanVariables: GlobalBooleanVariables
) {
  const channelElements = devices.flatMap((device) => device.channelElements);

  /** An array containing the control buttons of each main device */
  const deviceButtons = devices
    .filter((device) => device instanceof MainDevice)
    .flatMap((device) => (device as MainDevice).controlSectionElements.buttons);

  // Bind encoder display modes to custom host values
  const channelEncoderDisplayModeHostValues = channelElements.map((channel, channelIndex) => {
    const hostValue = page.mCustom.makeSettableHostValueVariable(
      `encoderDisplayMode${channelIndex}`
    );
    page.makeValueBinding(channel.encoder.mDisplayModeValue, hostValue);
    return hostValue;
  });

  const subPageArea = page.makeSubPageArea("Encoders");

  const bindEncoderAssignments = (assignmentButtonId: number, pages: EncoderPage[]) => {
    const encoderPageSize = channelElements.length;

    // Split each encoder page with more encoder assignments than physical encoders into multiple
    // pages
    pages = pages.flatMap((page) => {
      const assignments = page.assignments;
      if (Array.isArray(assignments) && assignments.length > encoderPageSize) {
        const chunks = [];
        for (let i = 0; i < assignments.length / encoderPageSize; i++) {
          chunks.push(assignments.slice(i * encoderPageSize, (i + 1) * encoderPageSize));
        }
        return chunks.map((chunk) => ({
          ...page,
          assignments: chunk,
        }));
      }

      return page;
    });

    // Create the corresponding sub pages and bindings for each encoder page
    const createdSubPages = pages.map(
      (
        { name: pageName, assignments: assignmentsConfig, areAssignmentsChannelRelated },
        encoderPageIndex
      ) => {
        const subPageName = `${pageName} ${encoderPageIndex + 1}`;
        const subPage = subPageArea.makeSubPage(subPageName);
        const flipSubPage = subPageArea.makeSubPage(`${subPageName} Flip`);

        for (const { flip: flipButton } of deviceButtons) {
          page
            .makeActionBinding(flipButton.mSurfaceValue, flipSubPage.mAction.mActivate)
            .setSubPage(subPage);
          page
            .makeActionBinding(flipButton.mSurfaceValue, subPage.mAction.mActivate)
            .setSubPage(flipSubPage);
        }

        const onSubPageActivate = makeCallbackCollection(subPage, "mOnActivate");
        onSubPageActivate.addCallback((context) => {
          segmentDisplayManager.setAssignment(
            context,
            pages.length === 1 ? "  " : `${encoderPageIndex + 1}.${pages.length}`
          );

          for (const [
            assignmentId,
            isActive,
          ] of globalBooleanVariables.isEncoderAssignmentActive.entries()) {
            // `runCallbacksInstantly=true` to update the LED(s) right away:
            isActive.set(context, assignmentButtonId === assignmentId, true);
          }
          globalBooleanVariables.isFlipModeActive.set(context, false);
          globalBooleanVariables.isValueDisplayModeActive.set(context, false);
        });

        flipSubPage.mOnActivate = (context) => {
          // `runCallbacksInstantly=true` to update the LED(s) right away:
          globalBooleanVariables.isFlipModeActive.set(context, true, true);
        };

        const assignments =
          typeof assignmentsConfig === "function"
            ? mixerBankChannels.map((channel, channelIndex) =>
                assignmentsConfig(channel, channelIndex)
              )
            : assignmentsConfig;

        for (const [channelIndex, { encoder, fader }] of channelElements.entries()) {
          const assignment: EncoderAssignment = {
            // @ts-expect-error `assignments[channelIndex]` may be undefined, but TS doesn't
            // consider that
            displayMode: EncoderDisplayMode.SingleDot,
            // @ts-expect-error
            encoderValue: page.mCustom.makeHostValueVariable("unassignedEncoderValue"),
            pushToggleValue: page.mCustom.makeHostValueVariable("unassignedEncoderPushValue"),
            ...assignments[channelIndex],
          };

          // Non-flipped encoder page sub page bindings
          page.makeValueBinding(encoder.mEncoderValue, assignment.encoderValue).setSubPage(subPage);
          if (config.enableAutoSelect) {
            page
              .makeValueBinding(
                fader.mTouchedValue,
                mixerBankChannels[channelIndex].mValue.mSelected
              )
              .filterByValue(1)
              .setSubPage(subPage);
          }

          if (assignment.pushToggleValue) {
            page
              .makeValueBinding(encoder.mPushValue, assignment.pushToggleValue)
              .setTypeToggle()
              .setSubPage(subPage);
          }

          // Flipped encoder page sub page bindings
          page
            .makeValueBinding(fader.mSurfaceValue, assignment.encoderValue)
            .setSubPage(flipSubPage);
          if (config.enableAutoSelect) {
            page
              .makeValueBinding(
                fader.mTouchedValue,
                mixerBankChannels[channelIndex].mValue.mSelected
              )
              // Don't select mixer channels on touch when a fader's value does not belong to its
              // mixer channel
              .filterByValue(+areAssignmentsChannelRelated)
              .setSubPage(flipSubPage);
          }

          onSubPageActivate.addCallback((context) => {
            encoder.mDisplayModeValue.setProcessValue(context, assignment.displayMode);
            // TODO https://forums.steinberg.net/t/831123
            // channelEncoderDisplayModeHostValues[channelIndex].setProcessValue(
            //   context,
            //   assignment.displayMode
            // );
          });
        }

        return { subPage, flipSubPage };
      }
    );

    // Bind encoder assign buttons to cycle through sub pages in a round-robin fashion
    for (const buttons of deviceButtons) {
      const encoderAssignButtonValue = buttons.encoderAssign[assignmentButtonId].mSurfaceValue;
      page.makeActionBinding(
        encoderAssignButtonValue,
        createdSubPages[0].subPage.mAction.mActivate
      );

      let previousSubPages = createdSubPages[0];
      for (const currentSubPages of createdSubPages) {
        page
          .makeActionBinding(encoderAssignButtonValue, currentSubPages.subPage.mAction.mActivate)
          .setSubPage(previousSubPages.subPage);
        page
          .makeActionBinding(encoderAssignButtonValue, currentSubPages.subPage.mAction.mActivate)
          .setSubPage(previousSubPages.flipSubPage);

        previousSubPages = currentSubPages;
      }
    }

    return createdSubPages;
  };

  // Defining Pan first so it is activated by default
  bindEncoderAssignments(1, [
    {
      name: "Pan",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.BoostOrCut,
        encoderValue: mixerBankChannel.mValue.mPan,
        pushToggleValue: mixerBankChannel.mValue.mMonitorEnable,
      }),
      areAssignmentsChannelRelated: true,
    },
  ]);

  const mMixerChannel = page.mHostAccess.mTrackSelection.mMixerChannel;

  bindEncoderAssignments(0, [
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
  bindEncoderAssignments(2, [
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
  bindEncoderAssignments(3, [
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
  const [pluginSubPages] = bindEncoderAssignments(4, [
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

  for (const buttons of deviceButtons) {
    for (const subPage of [pluginSubPages.subPage, pluginSubPages.flipSubPage]) {
      page
        .makeActionBinding(
          buttons.encoderAssign[4].mSurfaceValue,
          parameterBankZone.mAction.mNextBank
        )
        .setSubPage(subPage);
    }
  }

  const mStripEffects = mMixerChannel.mInsertAndStripEffects.mStripEffects;
  bindEncoderAssignments(5, [
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
