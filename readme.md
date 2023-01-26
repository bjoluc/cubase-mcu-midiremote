# cubase-xtouch-midiremote

Cubase 12 MIDI Remote Script for the Behringer X-Touch / X-Touch Extender

## Motivation

Since version 12, Cubase supports the customized integration of MIDI controllers via a new MIDI Remote JavaScript API.
Since the Behringer X-Touch is mostly a Mackie Control Universal (MCU) clone, it is traditionally set up as a Mackie Control device in Cubase.
However, the X-Touch has some unique features which set it apart from other MCU-compliant devices:

- The scribble strips are layed out as individual displays with a generous padding between them. MCU protocol implementations are designed to work with one continuous display and hence use empty characters for padding. Wouldn't it be nice to use all of the display space available, and at the same time avoid breaking words over channel boundaries?

- The scribble strip displays of the X-Touch have an RGB LED backlight, supporting 8 distinct colors plus black. When configured as a Mackie Control device in Cubase, all LCD displays are permanently lit in a bluish white, making users miss out on one of the X-Touch's nicest features. How cool would it be to have channel strips mirror track colors?

- All buttons (except of two) on the X-Touch have integrated LEDs (instead of separate LEDs above some buttons only). Given the shiny product images, shouldn't there be some more light, at least while pressing buttons?

## About this Script

The MIDI Remote Script developed in this repository serves as a full-featured replacement for the default Mackie Control setup.
Its mapping is widely similar to [Cubase's default Mackie MCU Pro mapping](https://download.steinberg.net/downloads_software/documentation/Remote_Control_Devices.pdf), with a few exceptions that are listed below:

- The 8 channel type buttons do not apply channel visibility presets and channel types, but are freely assignable in the MIDI Remote Mapping Assistant. I believe average users will not need 8 buttons for loading visibility presets. If they do need some, they can assign the buttons accordingly.
- The Channel Left/Right buttons below the Fader Bank buttons do not navigate between encoder parameter pages, but move the fader bank left/right by one channel – a feature I have often wished for in the default MCU mapping. Navigating parameter banks can be achieved by pressing the respective Encoder Assign button multiple times to cycle through the available parameter pages in a round-robin fashion.
- Parameter page numbers are not shown on the lower row of the scribble strip displays, but on the otherwise unused two-digit Assignment display below the Encoder Assign buttons. Only the number of the currently active page is displayed. Given the small number of parameter pages for most encoder assignments, I believe users will quickly get used to the missing parameter page count and appreciate that the lower scribble strip row keeps showing track names.
- Instead of spreading the "Send" encoder assignment options out on four parameter pages, there are only two pages now. The "Level" and "On" pages are combined into a single page where turning encoders modifies the send level and pushing encoders toggles a send slot's On/Off status. The "Pre/Post" page remains untouched, and the "Bus" page is omitted because the MIDI Remote API doesn't expose send busses.
- The "Plug-In" encoder assignment always follows the currently focused plugin window to avoid tedious plugin selection via push encoders.
- The "Inst" encoder assignment maps to the VST Quick Controls of the currently selected instrument track instead of channel strip parameters.

## Setup

## Setup with an X-Touch Extender unit

## Drawbacks

- The "Track" encoder assignment is missing the "Input Bus" and "Output Bus" pages which are not exposed by the MIDI Remote API. I prefer to use the mouse for routing anyway, as apposed to a push encoder and a tiny single-row string on a scribble strip display.
- The "Pan/Surround" encoder assignment is missing a second page for vertical panning which is not exposed by the MIDI Remote API.
- The "Send" encoder assignment doesn't include a "Bus" page because send busses are not exposed by the MIDI Remote API.
