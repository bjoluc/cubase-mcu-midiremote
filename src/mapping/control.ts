import { config, deviceConfig } from "/config";
import { ControlSectionSurfaceElements } from "/device-configs";
import { MainDevice } from "/devices";
import { GlobalState } from "/state";

function setShiftableButtonsLedValues(
  controlSectionElements: ControlSectionSurfaceElements,
  context: MR_ActiveDevice,
  value: number,
) {
  const buttons = controlSectionElements.buttons;

  for (const button of [
    buttons.edit,
    buttons.modify.undo,
    buttons.modify.save,
    buttons.utility.soloDefeat,
    buttons.transport.left,
    buttons.transport.right,
    buttons.transport.rewind,
    buttons.transport.forward,
    buttons.navigation.bank.left,
  ]) {
    button.setLedValue(context, value);
  }
}

export function bindMouseValueControl(page: MR_FactoryMappingPage, device: MainDevice) {
  const button = deviceConfig.getMouseValueModeButton
    ? deviceConfig.getMouseValueModeButton(device)
    : device.controlSectionElements.buttons.automation.sends;

  const subPageArea = page.makeSubPageArea("Cursor Value Control");
  const inactiveSubpage = subPageArea.makeSubPage("Cursor Value Control Inactive");
  const activeSubpage = subPageArea.makeSubPage("Cursor Value Control Active");

  const jogWheel = device.controlSectionElements.jogWheel;
  activeSubpage.mOnActivate = (context) => {
    button.setLedValue(context, 1);
    jogWheel.mKnobModeEnabledValue.setProcessValue(context, 1);
  };
  inactiveSubpage.mOnActivate = (context) => {
    button.setLedValue(context, 0);
    jogWheel.mKnobModeEnabledValue.setProcessValue(context, 0);
  };

  page
    .makeActionBinding(button.mSurfaceValue, activeSubpage.mAction.mActivate)
    .setSubPage(inactiveSubpage);
  page
    .makeActionBinding(button.mSurfaceValue, inactiveSubpage.mAction.mActivate)
    .setSubPage(activeSubpage);

  const encoders = deviceConfig.shallMouseValueModeMapAllEncoders
    ? device.channelElements.map((channelElements) => channelElements.encoder)
    : [device.channelElements[7].encoder];
  for (const encoder of encoders) {
    page
      .makeValueBinding(encoder.mEncoderValue, page.mHostAccess.mMouseCursor.mValueUnderMouse)
      .setSubPage(activeSubpage);
    page
      .makeValueBinding(encoder.mPushValue, page.mCustom.makeHostValueVariable("Undefined"))
      .setSubPage(activeSubpage);
  }

  const dummyHostVariable = page.mCustom.makeHostValueVariable("dummy");
  page.makeValueBinding(jogWheel.mSurfaceValue, dummyHostVariable).setSubPage(inactiveSubpage);
  page
    .makeValueBinding(jogWheel.mSurfaceValue, page.mHostAccess.mMouseCursor.mValueUnderMouse)
    .setSubPage(activeSubpage);
}

export function bindControlSection(
  page: MR_FactoryMappingPage,
  device: MainDevice,
  mixerBankZone: MR_MixerBankZone,
  globalState: GlobalState,
) {
  const host = page.mHostAccess;
  const controlSectionElements = device.controlSectionElements;
  const buttons = controlSectionElements.buttons;

  const buttonsSubPageArea = page.makeSubPageArea("Control Buttons");
  const regularSubPage = buttonsSubPageArea.makeSubPage("Regular");
  const shiftSubPage = buttonsSubPageArea.makeSubPage("Shift");

  globalState.isShiftModeActive.addOnChangeCallback((context, value, mapping) => {
    (value ? shiftSubPage : regularSubPage).mAction.mActivate.trigger(mapping!);
    setShiftableButtonsLedValues(controlSectionElements, context, +value);
  });

  // Flip button
  globalState.isFlipModeActive.addOnChangeCallback((context, value) => {
    buttons.flip.setLedValue(context, +value);
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

  // Edit
  page
    .makeCommandBinding(buttons.edit.mSurfaceValue, "Edit", "Edit Channel Settings")
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.edit.mSurfaceValue, "Windows", "Close All Plug-in Windows")
    .setSubPage(shiftSubPage);

  // Undo
  page
    .makeCommandBinding(buttons.modify.undo.mSurfaceValue, "Edit", "Undo")
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.modify.undo.mSurfaceValue, "Edit", "History")
    .setSubPage(shiftSubPage);

  // Redo
  page.makeCommandBinding(buttons.modify.redo.mSurfaceValue, "Edit", "Redo");

  // Save
  page
    .makeCommandBinding(buttons.modify.save.mSurfaceValue, "File", "Save")
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.modify.save.mSurfaceValue, "File", "Save New Version")
    .setSubPage(shiftSubPage);

  // Revert
  page.makeCommandBinding(buttons.modify.revert.mSurfaceValue, "File", "Revert");

  // Read/Off
  page
    .makeValueBinding(
      buttons.automation.read.mSurfaceValue,
      host.mTrackSelection.mMixerChannel.mValue.mAutomationRead,
    )
    .setTypeToggle();

  // Write
  page
    .makeValueBinding(
      buttons.automation.write.mSurfaceValue,
      host.mTrackSelection.mMixerChannel.mValue.mAutomationWrite,
    )
    .setTypeToggle();

  // Project
  page.makeCommandBinding(buttons.automation.project.mSurfaceValue, "Project", "Bring To Front");

  // Mixer
  page.makeCommandBinding(buttons.automation.mixer.mSurfaceValue, "Devices", "Mixer");

  // Motor
  page.makeValueBinding(
    buttons.automation.motor.mSurfaceValue,
    page.mCustom.makeHostValueVariable("Disable/Enable Fader Motors"),
  ).mOnValueChange = (context, _mapping, value) => {
    if (value) {
      globalState.areMotorsActive.toggle(context);
    }
  };
  globalState.areMotorsActive.addOnChangeCallback((context, value) => {
    buttons.automation.motor.setLedValue(context, +value);
  });

  // Instrument
  page.makeCommandBinding(
    buttons.utility.instrument.mSurfaceValue,
    "MixConsole History",
    "Undo MixConsole Step",
  );

  // Main
  page.makeCommandBinding(
    buttons.utility.main.mSurfaceValue,
    "MixConsole History",
    "Redo MixConsole Step",
  );

  // Solo Defeat
  page
    .makeCommandBinding(buttons.utility.soloDefeat.mSurfaceValue, "Edit", "Deactivate All Solo")
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.utility.soloDefeat.mSurfaceValue, "Edit", "Unmute All")
    .setSubPage(shiftSubPage);

  // Transport buttons
  const mTransport = host.mTransport;

  page
    .makeCommandBinding(buttons.transport.left.mSurfaceValue, "Transport", "To Left Locator")
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.transport.left.mSurfaceValue, "Transport", "Set Left Locator")
    .setSubPage(shiftSubPage);

  page
    .makeCommandBinding(buttons.transport.right.mSurfaceValue, "Transport", "To Right Locator")
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.transport.right.mSurfaceValue, "Transport", "Set Right Locator")
    .setSubPage(shiftSubPage);

  page
    .makeValueBinding(buttons.transport.cycle.mSurfaceValue, mTransport.mValue.mCycleActive)
    .setTypeToggle();
  page.makeCommandBinding(buttons.transport.punch.mSurfaceValue, "Transport", "Auto Punch In");

  page.makeCommandBinding(
    buttons.transport.markers.previous.mSurfaceValue,
    "Transport",
    "Locate Previous Marker",
  );
  page.makeCommandBinding(
    buttons.transport.markers.add.mSurfaceValue,
    "Transport",
    "Insert Marker",
  );
  page.makeCommandBinding(
    buttons.transport.markers.next.mSurfaceValue,
    "Transport",
    "Locate Next Marker",
  );

  page
    .makeValueBinding(buttons.transport.rewind.mSurfaceValue, mTransport.mValue.mRewind)
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.transport.rewind.mSurfaceValue, "Transport", "Return to Zero")
    .setSubPage(shiftSubPage);

  page
    .makeValueBinding(buttons.transport.forward.mSurfaceValue, mTransport.mValue.mForward)
    .setSubPage(regularSubPage);
  page
    .makeCommandBinding(buttons.transport.forward.mSurfaceValue, "Transport", "Goto End")
    .setSubPage(shiftSubPage);

  page
    .makeValueBinding(buttons.transport.stop.mSurfaceValue, mTransport.mValue.mStop)
    .setTypeToggle();
  page
    .makeValueBinding(buttons.transport.play.mSurfaceValue, mTransport.mValue.mStart)
    .setTypeToggle();
  page
    .makeValueBinding(buttons.transport.record.mSurfaceValue, mTransport.mValue.mRecord)
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

  // Jog Wheel
  const jogWheelSubPageArea = page.makeSubPageArea("Jog Wheel");
  const scrubSubPage = jogWheelSubPageArea.makeSubPage("Scrub");
  const jogSubPage = jogWheelSubPageArea.makeSubPage("Jog");

  const scrubButton = controlSectionElements.buttons.scrub;

  page.makeActionBinding(scrubButton.mSurfaceValue, jogWheelSubPageArea.mAction.mNext);

  jogSubPage.mOnActivate = (context) => {
    scrubButton.setLedValue(context, 1);
  };
  scrubSubPage.mOnActivate = (context) => {
    scrubButton.setLedValue(context, 0);
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
    buttons.navigation.directions.center.setLedValue(context, 1);
  };
  navigateSubPage.mOnActivate = (context) => {
    buttons.navigation.directions.center.setLedValue(context, 0);
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

  // Shift button(s)
  const shiftButtons = [buttons.utility.shift];
  if (deviceConfig.getSupplementaryShiftButtons) {
    shiftButtons.push(...deviceConfig.getSupplementaryShiftButtons(device));
  }

  for (const button of shiftButtons) {
    page.makeActionBinding(button.mSurfaceValue, shiftSubPage.mAction.mActivate).mOnValueChange = (
      context,
      mapping,
      value,
    ) => {
      globalState.isShiftModeActive.set(context, Boolean(value), mapping);
    };
  }
}
