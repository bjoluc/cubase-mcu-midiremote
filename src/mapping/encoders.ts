import { EncoderDisplayMode, ParameterName } from "src/midi";
import { SurfaceElements } from "src/surface";
import { makeCallbackCollection } from "src/util";

export interface EncoderAssignment {
  parameterName: ParameterName;
  encoderValue: MR_HostValue;
  displayMode: EncoderDisplayMode;
  pushToggleValue?: MR_HostValue;
}

export type EncoderAssignments = Array<
  EncoderAssignment | ((channel: MR_MixerBankChannel) => EncoderAssignment)
>;

export interface EncoderPage {
  name?: string;
  assignments: EncoderAssignment[] | ((channel: MR_MixerBankChannel) => EncoderAssignment);
}

export function bindEncoders(
  page: MR_FactoryMappingPage,
  elements: SurfaceElements,
  mixerBankChannels: MR_MixerBankChannel[]
) {
  const buttons = elements.control.buttons;
  const assignmentButtons = buttons.encoderAssign;
  const flipButtonValue = elements.control.buttons.flip.mSurfaceValue;

  const subPageArea = page.makeSubPageArea("Encoders");

  const bindEncorderAssignments = (assignmentButtonId: number, pages: EncoderPage[]) => {
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
          return chunks.map((chunk) => ({ ...page, assignments: chunk }));
        }

        return page;
      })

      // Create the corresponding sub pages and bindings for each encoder page
      .map(({ name: pageName, assignments: assignmentsConfig }, encoderPageIndex) => {
        const subPageName = `${pageName} ${encoderPageIndex + 1}`;
        const subPage = subPageArea.makeSubPage(subPageName);
        const flipSubPage = subPageArea.makeSubPage(`${subPageName} Flip`);

        page.makeActionBinding(flipButtonValue, flipSubPage.mAction.mActivate).setSubPage(subPage);
        page.makeActionBinding(flipButtonValue, subPage.mAction.mActivate).setSubPage(flipSubPage);

        const onSubPageActivate = makeCallbackCollection(subPage, "mOnActivate");

        onSubPageActivate.addCallback((context) => {
          elements.display.setAssignment(context, (encoderPageIndex + 1).toString());
          assignmentButtons.forEach((button, buttonNumber) => {
            button.mLedValue.setProcessValue(context, +(assignmentButtonId === buttonNumber));
          });
          elements.display.isValueModeActive.setProcessValue(context, 0);
        });

        const isPerChannelAssignment = typeof assignmentsConfig === "function";
        let assignments = isPerChannelAssignment
          ? mixerBankChannels.map((channel) => assignmentsConfig(channel))
          : assignmentsConfig;

        assignments.forEach((assignment, channelIndex) => {
          const channelElements = elements.channels[channelIndex];

          // Non-flipped encoder page sub page bindings
          page
            .makeValueBinding(channelElements.encoder.mEncoderValue, assignment.encoderValue)
            .setSubPage(subPage);
          page
            .makeValueBinding(
              channelElements.faderTouched,
              mixerBankChannels[channelIndex].mValue.mSelected
            )
            .filterByValue(1)
            .setSubPage(subPage);

          // Flipped encoder page sub page bindings
          page
            .makeValueBinding(channelElements.fader.mSurfaceValue, assignment.encoderValue)
            .setSubPage(flipSubPage);
          page
            .makeValueBinding(
              channelElements.faderTouched,
              mixerBankChannels[channelIndex].mValue.mSelected
            )
            // Don't select mixer channels on touch when a fader's value does not belong to its
            // mixer channel
            .filterByValue(+isPerChannelAssignment)
            .setSubPage(flipSubPage);

          onSubPageActivate.addCallback((context) => {
            channelElements.scribbleStrip.encoderParameterName.setProcessValue(
              context,
              assignment.parameterName
            );
            channelElements.encoderDisplayMode.setProcessValue(context, assignment.displayMode);
          });
        });

        return { subPage, flipSubPage };
      });

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
  };

  bindEncorderAssignments(0, [
    // Output Bus – No host values available
    {
      name: "Monitor",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.Wrap,
        encoderValue: mixerBankChannel.mValue.mMonitorEnable,
        parameterName: ParameterName.Monitor,
      }),
    },
    // Input Bus – No host values available
    {
      name: "Input Gain",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.BoostOrCut,
        encoderValue: mixerBankChannel.mPreFilter.mGain,
        parameterName: ParameterName.Gain,
      }),
    },
    {
      name: "Input Phase",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.Wrap,
        encoderValue: mixerBankChannel.mPreFilter.mPhaseSwitch,
        parameterName: ParameterName.Phase,
      }),
    },
  ]);

  bindEncorderAssignments(1, [
    {
      name: "Pan",
      assignments: (mixerBankChannel) => ({
        displayMode: EncoderDisplayMode.BoostOrCut,
        encoderValue: mixerBankChannel.mValue.mPan,
        parameterName: ParameterName.Pan,
      }),
    },
  ]);

  const mChannelEQ = page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ;

  bindEncorderAssignments(2, [
    {
      name: "EQ",
      assignments: [
        {
          parameterName: ParameterName.Eq1Freq,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: mChannelEQ.mBand1.mFreq,
        },
        {
          parameterName: ParameterName.Eq1Gain,
          displayMode: EncoderDisplayMode.BoostOrCut,
          encoderValue: mChannelEQ.mBand1.mGain,
        },
        {
          parameterName: ParameterName.Eq1Q,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: mChannelEQ.mBand1.mQ,
        },
        {
          parameterName: ParameterName.Eq1Type,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: mChannelEQ.mBand1.mFilterType,
        },
        {
          parameterName: ParameterName.Eq2Freq,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: mChannelEQ.mBand2.mFreq,
        },
        {
          parameterName: ParameterName.Eq2Gain,
          displayMode: EncoderDisplayMode.BoostOrCut,
          encoderValue: mChannelEQ.mBand2.mGain,
        },
        {
          parameterName: ParameterName.Eq2Q,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: mChannelEQ.mBand2.mQ,
        },
        {
          parameterName: ParameterName.Eq2Type,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: mChannelEQ.mBand2.mFilterType,
        },
        {
          parameterName: ParameterName.Eq3Freq,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: mChannelEQ.mBand3.mFreq,
        },
        {
          parameterName: ParameterName.Eq3Gain,
          displayMode: EncoderDisplayMode.BoostOrCut,
          encoderValue: mChannelEQ.mBand3.mGain,
        },
        {
          parameterName: ParameterName.Eq3Q,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: mChannelEQ.mBand3.mQ,
        },
        {
          parameterName: ParameterName.Eq3Type,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: mChannelEQ.mBand3.mFilterType,
        },
        {
          parameterName: ParameterName.Eq4Freq,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: mChannelEQ.mBand4.mFreq,
        },
        {
          parameterName: ParameterName.Eq4Gain,
          displayMode: EncoderDisplayMode.BoostOrCut,
          encoderValue: mChannelEQ.mBand4.mGain,
        },
        {
          parameterName: ParameterName.Eq4Q,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: mChannelEQ.mBand4.mQ,
        },
        {
          parameterName: ParameterName.Eq4Type,
          displayMode: EncoderDisplayMode.SingleDot,
          encoderValue: mChannelEQ.mBand4.mFilterType,
        },
      ],
    },
  ]);
}
