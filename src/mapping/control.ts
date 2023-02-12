import { DecoratedFactoryMappingPage } from "../decorators/page";
import { LedButton, LedPushEncoder } from "../decorators/surface";
import { EncoderDisplayMode } from "src/midi";
import { SurfaceElements } from "src/surface";

function setShiftableButtonsLedValues(
  elements: SurfaceElements,
  context: MR_ActiveDevice,
  value: number
) {
  const buttons = elements.control.buttons;

  for (const button of [buttons.edit, buttons.modify[0], buttons.modify[2], buttons.utility[2]]) {
    button.mLedValue.setProcessValue(context, value);
  }
}

function bindCursorValueControlButton(
  page: DecoratedFactoryMappingPage,
  button: LedButton,
  elements: SurfaceElements
) {
  const encoder = elements.channels[elements.channels.length - 1].encoder;
  const jogWheel = elements.control.jogWheel;

  const subPageArea = page.makeSubPageArea("Cursor Value Control");
  const inactiveSubpage = subPageArea.makeSubPage("Cursor Value Control Inactive");
  const activeSubpage = subPageArea.makeSubPage("Cursor Value Control Active");

  const encoderDisplayMode = page.mCustom.makeSettableHostValueVariable(
    `cursorValueControlEncoderDisplayMode`
  );

  activeSubpage.mOnActivate = (context) => {
    encoderDisplayMode.setProcessValue(context, EncoderDisplayMode.SingleDot);
    button.mLedValue.setProcessValue(context, 1);
    jogWheel.mKnobModeEnabledValue.setProcessValue(context, 1);
  };
  inactiveSubpage.mOnActivate = (context) => {
    button.mLedValue.setProcessValue(context, 0);
    jogWheel.mKnobModeEnabledValue.setProcessValue(context, 0);
  };

  page
    .makeActionBinding(button.mSurfaceValue, activeSubpage.mAction.mActivate)
    .setSubPage(inactiveSubpage);
  page
    .makeActionBinding(button.mSurfaceValue, inactiveSubpage.mAction.mActivate)
    .setSubPage(activeSubpage);

  page
    .makeValueBinding(encoder.mEncoderValue, page.mHostAccess.mMouseCursor.mValueUnderMouse)
    .setSubPage(activeSubpage);
  page.makeValueBinding(encoder.mDisplayModeValue, encoderDisplayMode).setSubPage(activeSubpage);

  const dummyHostVariable = page.mCustom.makeHostValueVariable("dummy");
  page.makeValueBinding(jogWheel.mSurfaceValue, dummyHostVariable).setSubPage(inactiveSubpage);
  page
    .makeValueBinding(jogWheel.mSurfaceValue, page.mHostAccess.mMouseCursor.mValueUnderMouse)
    .setSubPage(activeSubpage);
}

export function bindControlButtons(
  page: DecoratedFactoryMappingPage,
  elements: SurfaceElements,
  mixerBankZone: MR_MixerBankZone
) {
  const host = page.mHostAccess;
  const buttons = elements.control.buttons;

  const buttonsSubPageArea = page.makeSubPageArea("Control Buttons");
  const regularSubPage = buttonsSubPageArea.makeSubPage("Regular");
  const shiftSubPage = buttonsSubPageArea.makeSubPage("Shift");

  // 1-8
  buttons.number.forEach((button, buttonIndex) => {
    page.makeCommandBinding(
      button.mSurfaceValue,
      "Channel & Track Visibility",
      `Channel and Rack Configuration ${buttonIndex + 1}`
    );
  });

  // Free buttons
  for (const button of buttons.function) {
    page.makeCommandBinding(
      button.mSurfaceValue,
      "MIDI Remote",
      "Open MIDI Remote Mapping Assistant"
    );
  }

  // Edit
  page
    .makeCommandBinding(buttons.edit.mSurfaceValue, "Edit", "Edit Channel Settings")
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.edit.mSurfaceValue, "Windows", "Close All Plug-in Windows")
    .setSubPage(shiftSubPage);

  // Undo
  page
    .makeCommandBinding(buttons.modify[0].mSurfaceValue, "Edit", "Undo")
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.modify[0].mSurfaceValue, "Edit", "History")
    .setSubPage(shiftSubPage);

  // Redo
  page.makeCommandBinding(buttons.modify[1].mSurfaceValue, "Edit", "Redo");

  // Save
  page
    .makeCommandBinding(buttons.modify[2].mSurfaceValue, "File", "Save")
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.modify[2].mSurfaceValue, "File", "Save New Version")
    .setSubPage(shiftSubPage);

  // Revert
  page.makeCommandBinding(buttons.modify[3].mSurfaceValue, "File", "Revert");

  // Read/Off
  page
    .makeValueBinding(
      buttons.automation[0].mSurfaceValue,
      host.mTrackSelection.mMixerChannel.mValue.mAutomationRead
    )
    .setTypeToggle();

  // Write
  page
    .makeValueBinding(
      buttons.automation[1].mSurfaceValue,
      host.mTrackSelection.mMixerChannel.mValue.mAutomationWrite
    )
    .setTypeToggle();

  // Sends (Control value under cursor)
  bindCursorValueControlButton(page, buttons.automation[2], elements);

  // Project
  page.makeCommandBinding(buttons.automation[3].mSurfaceValue, "Project", "Bring To Front");

  // Mixer
  page.makeCommandBinding(buttons.automation[4].mSurfaceValue, "Devices", "Mixer");

  // Instrument
  page.makeCommandBinding(
    buttons.utility[0].mSurfaceValue,
    "MixConsole History",
    "Undo MixConsole Step"
  );

  // Main
  page.makeCommandBinding(
    buttons.utility[1].mSurfaceValue,
    "MixConsole History",
    "Redo MixConsole Step"
  );

  // Solo Defeat
  page
    .makeCommandBinding(buttons.utility[2].mSurfaceValue, "Edit", "Deactivate All Solo")
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.utility[2].mSurfaceValue, "Edit", "Unmute All")
    .setSubPage(shiftSubPage);

  // Shift button
  page.makeActionBinding(
    buttons.utility[3].mSurfaceValue,
    shiftSubPage.mAction.mActivate
  ).mOnValueChange = (context, mapping, value) => {
    if (value) {
      shiftSubPage.mAction.mActivate.trigger(mapping);
      setShiftableButtonsLedValues(elements, context, 1);
    } else {
      regularSubPage.mAction.mActivate.trigger(mapping);
      setShiftableButtonsLedValues(elements, context, 0);
    }
  };

  // Transport buttons
  const mTransport = host.mTransport;

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

  // Navigation Buttons
  const { bank, channel } = elements.control.buttons.navigation;
  page.makeActionBinding(bank.left.mSurfaceValue, mixerBankZone.mAction.mPrevBank);
  page.makeActionBinding(bank.right.mSurfaceValue, mixerBankZone.mAction.mNextBank);
  page.makeActionBinding(channel.left.mSurfaceValue, mixerBankZone.mAction.mShiftLeft);
  page.makeActionBinding(channel.right.mSurfaceValue, mixerBankZone.mAction.mShiftRight);
}

export function bindJogWheelSection(page: MR_FactoryMappingPage, elements: SurfaceElements) {
  const jogWheelSubPageArea = page.makeSubPageArea("jogWeel");
  const scrubSubPage = jogWheelSubPageArea.makeSubPage("scrub");
  const jogSubPage = jogWheelSubPageArea.makeSubPage("jog");

  const scrubButton = elements.control.buttons.scrub;

  page.makeActionBinding(scrubButton.mSurfaceValue, jogWheelSubPageArea.mAction.mNext);

  jogSubPage.mOnActivate = (context) => {
    scrubButton.mLedValue.setProcessValue(context, 1);
  };
  scrubSubPage.mOnActivate = (context) => {
    scrubButton.mLedValue.setProcessValue(context, 0);
  };

  const { mJogLeftValue: jogLeft, mJogRightValue: jogRight } = elements.control.jogWheel;
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

  elements.control.buttons.display.onSurfaceValueChange.addCallback((context, value) => {
    if (value === 1) {
      elements.display.isValueModeActive.setProcessValue(
        context,
        +!elements.display.isValueModeActive.getProcessValue(context)
      );
    }
  });

  // There's no "is solo mode active on any chanel" host value, is it?
  // page.makeValueBinding(elements.display.leds.solo, ? )
}

export function bindDirectionButtons(page: MR_FactoryMappingPage, elements: SurfaceElements) {
  const buttons = elements.control.buttons;

  const subPageArea = page.makeSubPageArea("Direction Buttons");
  const navigateSubPage = subPageArea.makeSubPage("Navigate");
  const zoomSubPage = subPageArea.makeSubPage("Zoom");

  zoomSubPage.mOnActivate = (context) => {
    buttons.navigation.directions.center.mLedValue.setProcessValue(context, 1);
  };
  navigateSubPage.mOnActivate = (context) => {
    buttons.navigation.directions.center.mLedValue.setProcessValue(context, 0);
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
