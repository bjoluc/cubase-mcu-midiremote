import { EncoderDisplayMode } from "./midi";
import { SurfaceElements } from "./surface";
import { makeCallbackCollection } from "./util";

export function createHostMapping(mapping: MR_FactoryMapping, elements: SurfaceElements) {
  const page = mapping.makePage("Mixer");
  const host = page.mHostAccess;

  // 7-segment display
  bindSegmentDisplaySection(page, elements);

  const onActivate = makeCallbackCollection(page, "mOnActivate");

  const mixerBankZone = page.mHostAccess.mMixConsole
    .makeMixerBankZone()
    .excludeInputChannels()
    .excludeOutputChannels();

  elements.channels.map((channelElements, index) => {
    const channel = mixerBankZone.makeMixerBankChannel();

    // Push Encoder
    onActivate.addCallback((context) => {
      channelElements.encoderDisplayMode.setProcessValue(context, EncoderDisplayMode.BoostOrCut);
    });
    page.makeValueBinding(channelElements.encoder.mEncoderValue, channel.mValue.mPan);

    // Scribble Strip
    page.makeValueBinding(channelElements.scribbleStrip.row2, channel.mValue.mVolume);

    // VU Meter
    page.makeValueBinding(channelElements.vuMeter, channel.mValue.mVUMeter);

    // Buttons
    const buttons = channelElements.buttons;
    page
      .makeValueBinding(buttons.record.mSurfaceValue, channel.mValue.mRecordEnable)
      .setTypeToggle();
    page.makeValueBinding(buttons.solo.mSurfaceValue, channel.mValue.mSolo).setTypeToggle();
    page.makeValueBinding(buttons.mute.mSurfaceValue, channel.mValue.mMute).setTypeToggle();
    page.makeValueBinding(buttons.select.mSurfaceValue, channel.mValue.mSelected).setTypeToggle();

    // Fader
    page.makeValueBinding(channelElements.fader.mSurfaceValue, channel.mValue.mVolume);
    page.makeValueBinding(channelElements.faderTouched, channel.mValue.mSelected).setTypeToggle();
  });

  // Transport section
  const buttons = elements.control.buttons;

  page.makeCommandBinding(buttons.transport[0].mSurfaceValue, "Transport", "To Left Locator");
  page.makeCommandBinding(buttons.transport[1].mSurfaceValue, "Transport", "To Right Locator");
  page
    .makeValueBinding(buttons.transport[2].mSurfaceValue, host.mTransport.mValue.mCycleActive)
    .setTypeToggle();
  page.makeCommandBinding(buttons.transport[3].mSurfaceValue, "Transport", "Auto Punch In");

  page.makeCommandBinding(
    buttons.transport[4].mSurfaceValue,
    "Transport",
    "Locate Previous Marker"
  );
  page.makeCommandBinding(buttons.transport[5].mSurfaceValue, "Transport", "Insert Marker");
  page.makeCommandBinding(buttons.transport[6].mSurfaceValue, "Transport", "Locate Next Marker");

  page.makeValueBinding(buttons.transport[7].mSurfaceValue, host.mTransport.mValue.mRewind);
  page.makeValueBinding(buttons.transport[8].mSurfaceValue, host.mTransport.mValue.mForward);
  page
    .makeValueBinding(buttons.transport[9].mSurfaceValue, host.mTransport.mValue.mStop)
    .setTypeToggle();
  page
    .makeValueBinding(buttons.transport[10].mSurfaceValue, host.mTransport.mValue.mStart)
    .setTypeToggle();
  page
    .makeValueBinding(buttons.transport[11].mSurfaceValue, host.mTransport.mValue.mRecord)
    .setTypeToggle();

  // Navigation section
  bindNavigationButtons(page, elements, mixerBankZone);
  bindDirectionButtons(page, elements);
}

function bindSegmentDisplaySection(page: MR_FactoryMappingPage, elements: SurfaceElements) {
  page.mHostAccess.mTransport.mTimeDisplay.mPrimary.mTransportLocator.mOnChange = (
    context,
    mapping,
    time,
    timeFormat
  ) => {
    elements.display.onTimeUpdated(context, time, timeFormat);
  };

  page.makeCommandBinding(
    elements.control.buttons.timeMode.mSurfaceValue,
    "Transport",
    "Exchange Time Formats"
  );

  // There's no "is solo mode active on any chanel" host value, is it?
  // page.makeValueBinding(elements.display.leds.solo, ? )
}

function bindNavigationButtons(
  page: MR_FactoryMappingPage,
  elements: SurfaceElements,
  mixerBankZone: MR_MixerBankZone
) {
  const buttons = elements.control.buttons;
  page.makeActionBinding(
    buttons.navigation.bank.left.mSurfaceValue,
    mixerBankZone.mAction.mPrevBank
  );
  page.makeActionBinding(
    buttons.navigation.bank.right.mSurfaceValue,
    mixerBankZone.mAction.mNextBank
  );
  page.makeActionBinding(
    buttons.navigation.channel.left.mSurfaceValue,
    mixerBankZone.mAction.mShiftLeft
  );
  page.makeActionBinding(
    buttons.navigation.channel.right.mSurfaceValue,
    mixerBankZone.mAction.mShiftRight
  );
}

function bindDirectionButtons(page: MR_FactoryMappingPage, elements: SurfaceElements) {
  const buttons = elements.control.buttons;

  const subPageArea = page.makeSubPageArea("Direction Buttons");
  const navigateSubPage = subPageArea.makeSubPage("Navigate");
  const zoomSubPage = subPageArea.makeSubPage("Zoom");

  zoomSubPage.mOnActivate = (context) => {
    buttons.navigation.directions.centerLed.setProcessValue(context, 1);
  };
  navigateSubPage.mOnActivate = (context) => {
    buttons.navigation.directions.centerLed.setProcessValue(context, 0);
  };

  const directions = buttons.navigation.directions;
  page
    .makeCommandBinding(directions.up.mSurfaceValue, "Navigate", "Up")
    .setSubPage(navigateSubPage);
  page
    .makeCommandBinding(directions.up.mSurfaceValue, "Zoom", "Zoom Out Vertically")
    .setSubPage(zoomSubPage);

  page
    .makeCommandBinding(directions.down.mSurfaceValue, "Navigate", "Down")
    .setSubPage(navigateSubPage);
  page
    .makeCommandBinding(directions.down.mSurfaceValue, "Zoom", "Zoom In Vertically")
    .setSubPage(zoomSubPage);

  page
    .makeCommandBinding(directions.left.mSurfaceValue, "Navigate", "Left")
    .setSubPage(navigateSubPage);
  page
    .makeCommandBinding(directions.left.mSurfaceValue, "Zoom", "Zoom Out")
    .setSubPage(zoomSubPage);

  page
    .makeCommandBinding(directions.right.mSurfaceValue, "Navigate", "Right")
    .setSubPage(navigateSubPage);
  page
    .makeCommandBinding(directions.right.mSurfaceValue, "Zoom", "Zoom In")
    .setSubPage(zoomSubPage);

  page.makeActionBinding(directions.center.mSurfaceValue, subPageArea.mAction.mNext);
}
