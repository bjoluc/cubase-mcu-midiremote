import { SurfaceElements } from "src/surface";

export function bindTransportButtons(page: MR_FactoryMappingPage, elements: SurfaceElements) {
  const mTransport = page.mHostAccess.mTransport;
  const buttons = elements.control.buttons;

  page.makeCommandBinding(buttons.transport[0].mSurfaceValue, "Transport", "To Left Locator");
  page.makeCommandBinding(buttons.transport[1].mSurfaceValue, "Transport", "To Right Locator");
  page
    .makeValueBinding(buttons.transport[2].mSurfaceValue, mTransport.mValue.mCycleActive)
    .setTypeToggle();
  page.makeCommandBinding(buttons.transport[3].mSurfaceValue, "Transport", "Auto Punch In");

  page.makeCommandBinding(
    buttons.transport[4].mSurfaceValue,
    "Transport",
    "Locate Previous Marker"
  );
  page.makeCommandBinding(buttons.transport[5].mSurfaceValue, "Transport", "Insert Marker");
  page.makeCommandBinding(buttons.transport[6].mSurfaceValue, "Transport", "Locate Next Marker");

  page.makeValueBinding(buttons.transport[7].mSurfaceValue, mTransport.mValue.mRewind);
  page.makeValueBinding(buttons.transport[8].mSurfaceValue, mTransport.mValue.mForward);
  page
    .makeValueBinding(buttons.transport[9].mSurfaceValue, mTransport.mValue.mStop)
    .setTypeToggle();
  page
    .makeValueBinding(buttons.transport[10].mSurfaceValue, mTransport.mValue.mStart)
    .setTypeToggle();
  page
    .makeValueBinding(buttons.transport[11].mSurfaceValue, mTransport.mValue.mRecord)
    .setTypeToggle();
}

export function bindJogWheelSection(page: MR_FactoryMappingPage, elements: SurfaceElements) {
  const jogWheelSubPageArea = page.makeSubPageArea("jogWeel");
  const scrubSubPage = jogWheelSubPageArea.makeSubPage("scrub");
  const jogSubPage = jogWheelSubPageArea.makeSubPage("jog");

  const { scrub, scrubLed } = elements.control.buttons;

  page.makeActionBinding(scrub.mSurfaceValue, jogWheelSubPageArea.mAction.mNext);

  jogSubPage.mOnActivate = (context) => {
    scrubLed.setProcessValue(context, 1);
  };
  scrubSubPage.mOnActivate = (context) => {
    scrubLed.setProcessValue(context, 0);
  };

  const { jogLeft, jogRight } = elements.control;
  page.makeCommandBinding(jogLeft, "Transport", "Jog Left").setSubPage(jogSubPage);
  page.makeCommandBinding(jogRight, "Transport", "Jog Right").setSubPage(jogSubPage);
  page.makeCommandBinding(jogLeft, "Transport", "Nudge Cursor Left").setSubPage(scrubSubPage);
  page.makeCommandBinding(jogRight, "Transport", "Nudge Cursor Right").setSubPage(scrubSubPage);
}

export function bindSegmentDisplaySection(page: MR_FactoryMappingPage, elements: SurfaceElements) {
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

  elements.control.buttons.display.mSurfaceValue.mOnProcessValueChange = (context, value) => {
    if (value === 1) {
      elements.display.isValueModeActive.setProcessValue(
        context,
        +!elements.display.isValueModeActive.getProcessValue(context)
      );
    }
  };

  // There's no "is solo mode active on any chanel" host value, is it?
  // page.makeValueBinding(elements.display.leds.solo, ? )
}

export function bindNavigationButtons(
  page: MR_FactoryMappingPage,
  elements: SurfaceElements,
  mixerBankZone: MR_MixerBankZone
) {
  const { bank, channel } = elements.control.buttons.navigation;
  page.makeActionBinding(bank.left.mSurfaceValue, mixerBankZone.mAction.mPrevBank);
  page.makeActionBinding(bank.right.mSurfaceValue, mixerBankZone.mAction.mNextBank);
  page.makeActionBinding(channel.left.mSurfaceValue, mixerBankZone.mAction.mShiftLeft);
  page.makeActionBinding(channel.right.mSurfaceValue, mixerBankZone.mAction.mShiftRight);
}

export function bindDirectionButtons(page: MR_FactoryMappingPage, elements: SurfaceElements) {
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
