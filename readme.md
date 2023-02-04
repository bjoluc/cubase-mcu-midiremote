# cubase-xtouch-midiremote

Cubase 12 MIDI Remote Script for the Behringer X-Touch / X-Touch Extender

<div align="center">
  <img alt="Surface Screenshot" width="800" src="./surface.png">
</div>

## TL;DR

This Cubase MIDI Remote Script replaces the default Mackie Control device setup and is tailored specifically to the Behringer X-Touch.
It can be [set up](#Setup) with a standalone X-Touch or with an X-Touch and an additional X-Touch Extender unit.
Notable features include:

- Track-colored scribble strips
- Full utilization of all scribble strip display segments – no padding characters, no words across scribble strip boundaries
- A modus to control any value under your mouse cursor with the rightmost push encoder or the jog wheel
- Encoder assignment for editing the currently focused plugin's parameters ("Plug-In" button)
- VST Quick Control encoder assignment ("Inst" button)

## Motivation

Since version 12, Cubase supports the customized integration of MIDI controllers via a new MIDI Remote JavaScript API.
The Behringer X-Touch, which is mostly a Mackie Control Universal (MCU) clone, is traditionally set up as a Mackie Control device in Cubase.
However, it has some unique features which set it apart from other MCU-compliant devices:

- The scribble strips are layed out as individual displays with a generous padding between them. MCU protocol implementations are designed to work with one continuous display and hence use empty characters for padding. Wouldn't it be nice to use all of the display space available, and at the same time avoid breaking words over channel boundaries?

- The scribble strip displays of the X-Touch have an RGB LED backlight, supporting 7 distinct colors plus black. When configured as a Mackie Control device in Cubase, all LCD displays are permanently lit in a bluish white, making users miss out on one of the X-Touch's nicest features. How cool would it be to have scribble strips mirror track colors?

- All buttons (except of two) on the X-Touch have integrated LEDs (instead of separate LEDs above some buttons only). Given the shiny product images, shouldn't there be some more light, at least while pressing buttons?

In addition to the points above, there are a couple of things that always bothered me about the default MCU mapping and that can be solved by a custom driver script:

- The meters do not match the scale of the MixConsole meters and require rather high levels to show up.
- Although there are exactly 8 push encoders, there is no encoder assignment for VST Quick controls.
- Bringing up the parameters of the currently focused plugin requires navigating through the list of insert slots with a push encoder.
- There is no single knob that can control any parameter under the mouse cursor, like in some of Steinberg's own controllers.

## About this Script

The MIDI Remote Script developed in this repository serves as a full replacement for the default Mackie Control setup.
Its mapping is similar to [Cubase's default Mackie MCU Pro mapping](https://download.steinberg.net/downloads_software/documentation/Remote_Control_Devices.pdf), with the following exceptions:

> **Note**
> In the rest of this document, all buttons below the 7-segment timecode display and above the five playback control buttons are referred to by their default Cubase MCU mapping labels instead of the ones printed on the X-Touch.
> I recommend an overlay for reference (be it an image like in the [remote control devices docs](https://download.steinberg.net/downloads_software/documentation/Remote_Control_Devices.pdf) or a [printed version](https://www.ebay.com/itm/255630543433)).

**Encoder Assignments**

- Parameter page numbers are not shown on the lower row of the scribble strip displays, but on the otherwise unused two-digit Assignment display below the Encoder Assign buttons. Only the number of the currently active page is displayed. Given the small number of parameter pages for most encoder assignments, I believe users will quickly get used to the missing parameter page count and appreciate that the lower scribble strip row keeps showing track names.
- Instead of spreading the "Send" encoder assignment options out on four parameter pages, there are only two pages now. The "Level" and "On" pages are combined into a single page where turning encoders modifies the send level and pushing encoders toggles a send slot's On/Off status. The "Pre/Post" page remains untouched, and the "Bus" page is omitted because the MIDI Remote API doesn't expose send busses.
- The "Plug-In" encoder assignment always follows the currently focused plugin window to avoid tedious plugin selection via push encoders.
- The "Inst" encoder assignment maps to the VST Quick Controls of the currently selected instrument track instead of channel strip parameters.

**Buttons**

- Like in the MCU default mapping, the 8 channel type buttons apply MixConsole channel visibility presets 1-8. In the likely case that you don't want to waste 8 prominent buttons for loading visibility presets, feel free to re-assign some buttons in the MIDI Remote Mapping Assistant.
- The Channel Left/Right buttons below the Fader Bank buttons do not navigate between encoder parameter pages, but move the fader bank left/right by one channel. Navigating parameter banks can be achieved by pressing the respective Encoder Assign button multiple times to cycle through the available parameter pages in a round-robin fashion.
- Pressing "Shift + Edit" closes all **plugin** windows instead of only the currently active window (I couldn't find a command to "close the currently active window").
- The "Instrument" and "Master" buttons are assigned to the handy MixConsole History Undo and Redo commands, respectively. In the default MCU mapping, they would activate instrument and main effects encoder assignments. I find using these on the X-Touch more complicated than using the mouse for the same tasks and hence didn't implement them.
- For the same reason, the "Sends" button doesn't activate a send effects encoder assignment. Instead, it turns the rightmost push encoder and the jog wheel into controllers for the value that's currently under the mouse cursor.

## Setup

- Make sure the firmware of your X-Touch (/X-Touch Extender) [is up to date](https://www.youtube.com/watch?v=Q4ZKXVXQP8g) (>= v1.22)
- Set your X-Touch unit(s) to [Mackie Control (MC) mode](https://www.youtube.com/watch?v=LrVWRgJbSyw&t=68s)
- Open up Cubase and make sure you are running version v12.0.52 or later
- In the studio setup window, remove any Mackie Control remote devices that you set up for your X-Touch / X-Touch Extender (don't forget to take screenshots of your command assignments)
- On windows, open `C:\Users\<Username>\Documents\Steinberg\Cubase\MIDI Remote\Driver Scripts\Local` and create the nested directories `behringer\xtouch` within it.
- On MacOS, open `/Users/<Username>/Documents/Steinberg/Cubase/MIDI Remote/Driver Scripts/Local` and create the nested directories `behringer/xtouch` within it.
- [Download](https://github.com/bjoluc/cubase-xtouch-midiremote/releases/latest/download/behringer_xtouch.js) the MIDI Remote script file from the latest GitHub release and move it into the newly created directory (`.../Local/behringer/xtouch`).
- Restart Cubase

Cubase should automatically detect the X-Touch and enable it as a MIDI Remote. If it doesn't, you can manually configure the MIDI Remote by clicking the "+" button in the lower zone's MIDI Remote pane.

## Setup with an X-Touch Extender unit

To use the X-Touch with an X-Touch Extender unit, follow the same steps as above, but edit the script file before restarting Cubase:
In the configuration options at the top of the file, replace `devices: ["main"]` with `devices: ["extender", "main"]` (or `devices: ["main", "extender"]` if you have your extender on the right side of the main device).

Then restart Cubase and configure the MIDI Remote by clicking the "+" button in the lower zone's MIDI Remote pane.

## Configuration Options

The very top of the MIDI Remote script file declares a number of configuration options.
You can edit these options to match your preferences.
Each option is documented in a comment above it, so feel free to consult the [script file](https://github.com/bjoluc/cubase-xtouch-midiremote/releases/latest/download/behringer_xtouch.js) for all available configuration options.

## Drawbacks

**Quirks to be fixed:**

- The time display is not updated upon initialization to avoid https://forums.steinberg.net/t/829417
- When controlling under-the-cursor values, the encoder's LED ring is not updated to single-dot mode but remains in whatever mode the currently active encoder assignment demands (blocked by https://forums.steinberg.net/t/831123).

**Current limitations of the MIDI Remote API:**

- The "Track" encoder assignment is missing the "Input Bus" and "Output Bus" pages which are not exposed by the MIDI Remote API. I prefer to use the mouse for routing anyway, as apposed to a push encoder and a tiny single-row string on a scribble strip display.
- The "Pan/Surround" encoder assignment is missing a second page for vertical panning which is not exposed by the MIDI Remote API.
- The "Send" encoder assignment doesn't include a "Bus" page because send busses are not exposed by the MIDI Remote API.
- The "Plug-In" encoder assignment doesn't display the number of the active parameter page because it is not exposed by the MIDI Remote API.
- The punch button doesn't light up when "Auto Punch In" is activated – no host value available
- The global "Solo" LED doesn't light up when a channel is in solo mode – no host value available
- Channel visibility presets do not affect channel assignments since the `MixerBankZone` of the MIDI Remote API doesn't respect channel visibility presets.
- The function buttons F1-F8 can only have one assignment per button, no matter whether "Shift" is held or not ("Shift" activates a sub page and the Mapping Assistant doesn't consider sub pages)
