import { config } from "src/config";
import { DecoratedFactoryMappingPage } from "../decorators/page";
import { EncoderDisplayMode } from "../midi";
import { ActivationCallbacks } from "../midi/connection";
import { SurfaceElements } from "../surface";
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
  hidePageIndex?: Boolean;
}

export function bindEncoders(
  page: DecoratedFactoryMappingPage,
  elements: SurfaceElements,
  mixerBankChannels: MR_MixerBankChannel[],
  hostDefaults: MR_HostDefaults,
  activationCallbacks: ActivationCallbacks
) {
  const buttons = elements.control.buttons;
  const assignmentButtons = buttons.encoderAssign;
  const flipButton = elements.control.buttons.flip;

  // Bind encoder display modes to custom host values
  const channelEncoderDisplayModeHostValues = elements.channels.map((channel, channelIndex) => {
    const hostValue = page.mCustom.makeSettableHostValueVariable(
      `encoderDisplayMode${channelIndex}`
    );
    page.makeValueBinding(channel.encoder.mDisplayModeValue, hostValue);
    return hostValue;
  });

  const subPageArea = page.makeSubPageArea("Encoders");

  const bindEncoderAssignments = (assignmentButtonId: number, pages: EncoderPage[]) => {
    const encoderPageSize = elements.channels.length;

    const createdSubPages = pages
      // Split each encoder page with more encoder assignments than physical encoders into multiple
      // pages
      .flatMap((page) => {
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
      })

      // Create the corresponding sub pages and bindings for each encoder page
      .map(
        (
          {
            name: pageName,
            assignments: assignmentsConfig,
            areAssignmentsChannelRelated,
            hidePageIndex,
          },
          encoderPageIndex
        ) => {
          const subPageName = `${pageName} ${encoderPageIndex + 1}`;
          const subPage = subPageArea.makeSubPage(subPageName);
          const flipSubPage = subPageArea.makeSubPage(`${subPageName} Flip`);

          page
            .makeActionBinding(flipButton.mSurfaceValue, flipSubPage.mAction.mActivate)
            .setSubPage(subPage);
          page
            .makeActionBinding(flipButton.mSurfaceValue, subPage.mAction.mActivate)
            .setSubPage(flipSubPage);

          const onSubPageActivate = makeCallbackCollection(subPage, "mOnActivate");
          onSubPageActivate.addCallback((context) => {
            elements.display.setAssignment(
              context,
              hidePageIndex ? "  " : (encoderPageIndex + 1).toString()
            );

            assignmentButtons.forEach((button, buttonNumber) => {
              button.mLedValue.setProcessValue(context, +(assignmentButtonId === buttonNumber));
            });
            flipButton.mLedValue.setProcessValue(context, 0);

            elements.display.isValueModeActive.setProcessValue(context, 0);
          });

          flipSubPage.mOnActivate = (context) => {
            flipButton.mLedValue.setProcessValue(context, 1);
          };

          const assignments =
            typeof assignmentsConfig === "function"
              ? mixerBankChannels.map((channel, channelIndex) =>
                  assignmentsConfig(channel, channelIndex)
                )
              : assignmentsConfig;

          assignments.forEach((assignment, channelIndex) => {
            const channelElements = elements.channels[channelIndex];

            // Non-flipped encoder page sub page bindings
            page
              .makeValueBinding(channelElements.encoder.mEncoderValue, assignment.encoderValue)
              .setSubPage(subPage);
            if (config.enableAutoSelect) {
              page
                .makeValueBinding(
                  channelElements.fader.mTouchedValue,
                  mixerBankChannels[channelIndex].mValue.mSelected
                )
                .filterByValue(1)
                .setSubPage(subPage);
            }

            if (assignment.pushToggleValue) {
              page
                .makeValueBinding(channelElements.encoder.mPushValue, assignment.pushToggleValue)
                .setTypeToggle()
                .setSubPage(subPage);
            }

            // Flipped encoder page sub page bindings
            page
              .makeValueBinding(channelElements.fader.mSurfaceValue, assignment.encoderValue)
              .setSubPage(flipSubPage);
            if (config.enableAutoSelect) {
              page
                .makeValueBinding(
                  channelElements.fader.mTouchedValue,
                  mixerBankChannels[channelIndex].mValue.mSelected
                )
                // Don't select mixer channels on touch when a fader's value does not belong to its
                // mixer channel
                .filterByValue(+areAssignmentsChannelRelated)
                .setSubPage(flipSubPage);
            }

            onSubPageActivate.addCallback((context) => {
              channelElements.encoder.mDisplayModeValue.setProcessValue(
                context,
                assignment.displayMode
              );
              // TODO https://forums.steinberg.net/t/831123
              // channelEncoderDisplayModeHostValues[channelIndex].setProcessValue(
              //   context,
              //   assignment.displayMode
              // );
            });
          });

          return { subPage, flipSubPage };
        }
      );

    // Bind encoder assign button to cycle through sub pages in a round-robin fashion
    const encoderAssignButtonValue = assignmentButtons[assignmentButtonId].mSurfaceValue;
    page.makeActionBinding(encoderAssignButtonValue, createdSubPages[0].subPage.mAction.mActivate);

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

  bindEncoderAssignments(0, [
    {
      name: "Monitor",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.Wrap,
        encoderValue: mixerBankChannel.mValue.mMonitorEnable,
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
  ]);

  const mChannelEQ = page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ;
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

  const mSends = page.mHostAccess.mTrackSelection.mMixerChannel.mSends;
  const sendSlotsCount = hostDefaults.getNumberOfSendSlots();
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

  const effectsViewer = page.mHostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
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
      hidePageIndex: true,
    },
  ]);

  for (const subPage of [pluginSubPages.subPage, pluginSubPages.flipSubPage]) {
    page
      .makeActionBinding(assignmentButtons[4].mSurfaceValue, parameterBankZone.mAction.mNextBank)
      .setSubPage(subPage);
  }

  const mQuickControls = page.mHostAccess.mTrackSelection.mMixerChannel.mQuickControls;
  bindEncoderAssignments(5, [
    {
      name: "Quick Controls",
      assignments: (mixerBankChannel, channelIndex) => {
        return {
          encoderValue: mQuickControls.getByIndex(channelIndex),
          displayMode: EncoderDisplayMode.SingleDot,
        };
      },
      areAssignmentsChannelRelated: false,
    },
  ]);
}
