import { config } from "../config";
import { DecoratedFactoryMappingPage } from "../decorators/page";
import { JogWheel, LedButton, LedPushEncoder } from "../decorators/surface";
import { ChannelSurfaceElements, ControlSectionSurfaceElements } from "../device-configs";
import { EncoderDisplayMode } from "../midi";
import { GlobalState } from "../state";

function setShiftableButtonsLedValues(
  controlSectionElements: ControlSectionSurfaceElements,
  context: MR_ActiveDevice,
  value: number,
) {
  const buttons = controlSectionElements.buttons;

  for (const button of [
    buttons.edit,
    buttons.modify[0],
    buttons.modify[2],
    buttons.utility[2],
    buttons.transport[0],
    buttons.transport[1],
    buttons.navigation.bank.left,
  ]) {
    button.mLedValue.setProcessValue(context, value);
  }
}

function bindCursorValueControlButton(
  page: DecoratedFactoryMappingPage,
  button: LedButton,
  encoder: LedPushEncoder,
  jogWheel: JogWheel,
) {
  const subPageArea = page.makeSubPageArea("Cursor Value Control");
  const inactiveSubpage = subPageArea.makeSubPage("Cursor Value Control Inactive");
  const activeSubpage = subPageArea.makeSubPage("Cursor Value Control Active");

  const encoderDisplayMode = page.mCustom.makeSettableHostValueVariable(
    `cursorValueControlEncoderDisplayMode`,
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

export function bindControlSection(
  page: DecoratedFactoryMappingPage,
  controlSectionElements: ControlSectionSurfaceElements,
  channelElements: ChannelSurfaceElements[],
  mixerBankZone: MR_MixerBankZone,
  globalState: GlobalState,
) {
  const host = page.mHostAccess;
  const buttons = controlSectionElements.buttons;

  const buttonsSubPageArea = page.makeSubPageArea("Control Buttons");
  const regularSubPage = buttonsSubPageArea.makeSubPage("Regular");
  const shiftSubPage = buttonsSubPageArea.makeSubPage("Shift");

  globalState.isShiftModeActive.addOnChangeCallback((context, value, mapping) => {
    (value ? shiftSubPage : regularSubPage).mAction.mActivate.trigger(mapping!);
    setShiftableButtonsLedValues(controlSectionElements, context, +value);
  });

  // Encoder assignment buttons
  globalState.activeEncoderAssignmentId.addOnChangeCallback((context, activeAssignmentId) => {
    for (const [buttonIndex, button] of buttons.encoderAssign.entries()) {
      button.mLedValue.setProcessValue(context, +(buttonIndex === activeAssignmentId));
    }
  });

  globalState.isFlipModeActive.addOnChangeCallback((context, value) => {
    buttons.flip.mLedValue.setProcessValue(context, +value);
  });

  // Display mode button
  page
    .makeValueBinding(
      buttons.display.mSurfaceValue,
      page.mCustom.makeHostValueVariable("Display Name/Value"),
    )
    .setSubPage(regularSubPage).mOnValueChange = (context, mapping, value) => {
    if (value) {
      globalState.isValueDisplayModeActive.toggle(context);
    }
  };

  page
    .makeValueBinding(
      buttons.display.mSurfaceValue,
      page.mCustom.makeHostValueVariable("Flip Display Rows"),
    )
    .setSubPage(shiftSubPage).mOnValueChange = (context, mapping, value) => {
    if (value) {
      globalState.areDisplayRowsFlipped.toggle(context);
    }
  };

  // SMPTE/Beats button
  page
    .makeCommandBinding(
      controlSectionElements.buttons.timeMode.mSurfaceValue,
      "Transport",
      "Exchange Time Formats",
    )
    .setSubPage(config.toggleMeteringModeWithoutShift ? shiftSubPage : regularSubPage);

  if (DEVICE_NAME === "MCU Pro") {
    // LCD metering is only supported by the original MCU
    page
      .makeValueBinding(
        controlSectionElements.buttons.timeMode.mSurfaceValue,
        page.mCustom.makeHostValueVariable("Metering Mode"),
      )
      .setSubPage(
        config.toggleMeteringModeWithoutShift ? regularSubPage : shiftSubPage,
      ).mOnValueChange = (context, mapping, value) => {
      if (value === 1) {
        const areMetersEnabled = globalState.areChannelMetersEnabled;
        const isMeterModeVertical = globalState.isGlobalLcdMeterModeVertical;

        // Toggle between no LCD metering, vertical, and horizontal mode
        if (!areMetersEnabled.get(context)) {
          areMetersEnabled.set(context, true);
          isMeterModeVertical.set(context, true);
        } else {
          if (isMeterModeVertical.get(context)) {
            isMeterModeVertical.set(context, false);
          } else {
            areMetersEnabled.set(context, false);
            isMeterModeVertical.set(context, true);
          }
        }
      }
    };
  }

  // 1-8
  for (const [buttonIndex, button] of buttons.number.entries()) {
    page.makeCommandBinding(
      button.mSurfaceValue,
      "Channel & Track Visibility",
      `Channel and Rack Configuration ${buttonIndex + 1}`,
    );
  }

  // Function buttons
  for (const button of buttons.function) {
    page.makeCommandBinding(
      button.mSurfaceValue,
      "MIDI Remote",
      "Open MIDI Remote Mapping Assistant",
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
      host.mTrackSelection.mMixerChannel.mValue.mAutomationRead,
    )
    .setTypeToggle();

  // Write
  page
    .makeValueBinding(
      buttons.automation[1].mSurfaceValue,
      host.mTrackSelection.mMixerChannel.mValue.mAutomationWrite,
    )
    .setTypeToggle();

  // Sends (Control value under cursor)
  bindCursorValueControlButton(
    page,
    buttons.automation[2],
    channelElements[7].encoder,
    controlSectionElements.jogWheel,
  );

  // Project
  page.makeCommandBinding(buttons.automation[3].mSurfaceValue, "Project", "Bring To Front");

  // Mixer
  page.makeCommandBinding(buttons.automation[4].mSurfaceValue, "Devices", "Mixer");

  // Motor
  page.makeValueBinding(
    buttons.automation[5].mSurfaceValue,
    page.mCustom.makeHostValueVariable("Disable/Enable Fader Motors"),
  ).mOnValueChange = (context, mapping, value) => {
    if (value) {
      globalState.areMotorsActive.toggle(context);
    }
  };
  globalState.areMotorsActive.addOnChangeCallback((context, value) => {
    buttons.automation[5].mLedValue.setProcessValue(context, +value);
  });

  // Instrument
  page.makeCommandBinding(
    buttons.utility[0].mSurfaceValue,
    "MixConsole History",
    "Undo MixConsole Step",
  );

  // Main
  page.makeCommandBinding(
    buttons.utility[1].mSurfaceValue,
    "MixConsole History",
    "Redo MixConsole Step",
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
    shiftSubPage.mAction.mActivate,
  ).mOnValueChange = (context, mapping, value) => {
    globalState.isShiftModeActive.set(context, Boolean(value), mapping);
  };

  // Transport buttons
  const mTransport = host.mTransport;

  page
    .makeCommandBinding(buttons.transport[0].mSurfaceValue, "Transport", "To Left Locator")
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.transport[0].mSurfaceValue, "Transport", "Set Left Locator")
    .setSubPage(shiftSubPage);

  page
    .makeCommandBinding(buttons.transport[1].mSurfaceValue, "Transport", "To Right Locator")
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.transport[1].mSurfaceValue, "Transport", "Set Right Locator")
    .setSubPage(shiftSubPage);

  page
    .makeValueBinding(buttons.transport[2].mSurfaceValue, mTransport.mValue.mCycleActive)
    .setTypeToggle();
  page.makeCommandBinding(buttons.transport[3].mSurfaceValue, "Transport", "Auto Punch In");

  page.makeCommandBinding(
    buttons.transport[4].mSurfaceValue,
    "Transport",
    "Locate Previous Marker",
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
  const { bank, channel } = buttons.navigation;
  page
    .makeActionBinding(bank.left.mSurfaceValue, mixerBankZone.mAction.mPrevBank)
    .setSubPage(regularSubPage);
  page
    .makeActionBinding(bank.left.mSurfaceValue, mixerBankZone.mAction.mResetBank)
    .setSubPage(shiftSubPage);
  page.makeActionBinding(bank.right.mSurfaceValue, mixerBankZone.mAction.mNextBank);

  page.makeActionBinding(channel.left.mSurfaceValue, mixerBankZone.mAction.mShiftLeft);
  page.makeActionBinding(channel.right.mSurfaceValue, mixerBankZone.mAction.mShiftRight);

  // Jogwheel
  const jogWheelSubPageArea = page.makeSubPageArea("jogWeel");
  const scrubSubPage = jogWheelSubPageArea.makeSubPage("scrub");
  const jogSubPage = jogWheelSubPageArea.makeSubPage("jog");

  const scrubButton = controlSectionElements.buttons.scrub;

  page.makeActionBinding(scrubButton.mSurfaceValue, jogWheelSubPageArea.mAction.mNext);

  jogSubPage.mOnActivate = (context) => {
    scrubButton.mLedValue.setProcessValue(context, 1);
  };
  scrubSubPage.mOnActivate = (context) => {
    scrubButton.mLedValue.setProcessValue(context, 0);
  };

  const { mJogLeftValue: jogLeft, mJogRightValue: jogRight } = controlSectionElements.jogWheel;
  page.makeCommandBinding(jogLeft, "Transport", "Jog Left").setSubPage(jogSubPage);
  page.makeCommandBinding(jogRight, "Transport", "Jog Right").setSubPage(jogSubPage);
  page.makeCommandBinding(jogLeft, "Transport", "Nudge Cursor Left").setSubPage(scrubSubPage);
  page.makeCommandBinding(jogRight, "Transport", "Nudge Cursor Right").setSubPage(scrubSubPage);

  // Direction buttons
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

  // Use the zoom subpage to make the jog wheel zoom too
  page.makeCommandBinding(jogLeft, "Zoom", "Zoom Out").setSubPage(zoomSubPage);
  page.makeCommandBinding(jogRight, "Zoom", "Zoom In").setSubPage(zoomSubPage);

  page.makeActionBinding(directions.center.mSurfaceValue, subPageArea.mAction.mNext);
}

export function bindFootControl(
  page: DecoratedFactoryMappingPage,
  controlSectionElements: ControlSectionSurfaceElements,
) {
  for (const footSwitch of controlSectionElements.footSwitches) {
    page.makeCommandBinding(
      footSwitch.mSurfaceValue,
      "MIDI Remote",
      "Open MIDI Remote Mapping Assistant",
    );
  }
}
