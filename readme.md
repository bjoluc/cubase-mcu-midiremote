# cubase-mcu-midiremote

[![Latest version](https://img.shields.io/github/package-json/v/bjoluc/cubase-xtouch-midiremote)](https://github.com/bjoluc/cubase-xtouch-midiremote/releases)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/bjoluc/cubase-xtouch-midiremote/build.yml)
![GitHub release download count](https://img.shields.io/github/downloads/bjoluc/cubase-mcu-midiremote/total)
![Minimum required Cubase version](https://img.shields.io/badge/Cubase->=_v12.0.52-blue)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Support me on Ko-fi](https://img.shields.io/badge/%E2%98%95-Support%20me%20on%20Ko--fi-brown)](https://ko-fi.com/bjoluc)

Cubase MIDI Remote Scripts for DAW Controllers using the MCU Protocol

<div align="center">
  <img alt="Surface Screenshot" width="800" src="./images/surface.png">
</div>

The following devices are explicitly supported:

- Behringer:
  - X-Touch / X-Touch Extender
  - X-Touch One <sup>\*</sup>
- iCON:
  - Platform M+ / X+ <sup>\*</sup>
  - QCon Pro G2 / QCon EX G2
  - V1-M / V1-X <sup>\*</sup>
- Mackie Control Universal (Pro) / XT (Pro)
- SSL UF1 <sup>\*</sup>

<sup>\* See [Supplementary Remarks for Individual Scripts](#supplementary-remarks-for-individual-scripts)</sup>

Other MCU-compatible devices may work with any of these scripts, but their device surface is not explicitly displayed in Cubase.
Feel free to open a discussion on GitHub if you would like your MCU-like device to be supported.

- [TL;DR](#tldr)
- [Motivation](#motivation)
- [Setup](#setup)
- [Configuration Options](#configuration-options)
- [Mapping](#mapping)
- [Drawbacks](#drawbacks)
- [Supplementary Remarks for Individual Scripts](#supplementary-remarks-for-individual-scripts)
- [Troubleshooting](#troubleshooting)

## TL;DR

The Cubase MIDI Remote Scripts developed in this repository replace the default Mackie Control device setup for various MCU-like devices.
They can be [set up](#setup) with single standalone controllers or with an arbitrary combination of standalone and extender units.
The mapping is reasonably close to the default MCU mapping, with a few (workflow-)improving changes.
Nevertheless, you can easily re-map most control elements using Cubase's MIDI Remote Mapping Assistant.

## Motivation

Since version 12, Cubase supports the customized integration of MIDI controllers via a new MIDI Remote JavaScript API.
Several vendors are producing DAW controllers similar to the Mackie Control Universal (MCU) which are traditionally set up as Mackie Control devices in Cubase.
Creating MIDI Remote API scripts for these controllers allows to improve the mapping where applicable and offers users the possibility to override parts of it themselves via Cubase's MIDI Remote Mapping Assistant.

Moreover, some controllers have features that are not available with the default Mackie Control setup in Cubase.
For instance, the Behringer X-Touch has an individual, RGB-backlit scribble strip display per channel, as well as integrated LEDs in most buttons.
A MIDI Remote API script can illuminate these scribble strips according to their tracks' colors, avoid unnecessary display padding characters, and light up buttons while they are being pressed.

## Setup

- Make sure the firmware of your device(s) is up to date ([iCON QCon Pro G2](https://iconproaudio.com/product/qcon-pro-g2/) >= 1.13, [Behringer X-Touch](https://www.youtube.com/watch?v=Q4ZKXVXQP8g) >= v1.22 or scribble strip colors will not work)
- If your devices have multiple operation modes, select Mackie Control mode ([here's](https://www.youtube.com/watch?v=LrVWRgJbSyw&t=68s) how to do it on the X-Touch).
- Open up Cubase and ensure you are running version 12.0.52 or later
- In the studio setup window, remove any Mackie Control remote devices (don't forget to take screenshots of your command assignments). If you don't feel comfortable removing the devices, it is also fine to select "Not Connected" for their ports.
- Open the [latest GitHub release page](https://github.com/bjoluc/cubase-xtouch-midiremote/releases/latest) and in the "Assets" section, download the script (.js) that is named like your device.
- Open `C:\Users\<Username>\Documents\Steinberg\Cubase\MIDI Remote\Driver Scripts\Local` (Windows) or `/Users/<Username>/Documents/Steinberg/Cubase/MIDI Remote/Driver Scripts/Local` (MacOS).
- The filename of the script you downloaded has the form `<Vendor>_<Device>.js`. Cubase expects scripts to be nested in subdirectories named precisely after the script's vendor and device. So within the `Local` folder, create the subdirectories `<Vendor>\<Device>` according to the device and vendor portions of the script's filename. For instance, if you downloaded `behringer_xtouch.js`, the subdirectories would need to be `behringer\xtouch`.

  > **Note**
  > Directory names matter.
  > Make sure your subdirectory names precisely match the device and vendor components of the script filename, or Cubase might not recognize the script.

- Move the script file into the newly created subdirectory.
- <details>
  <summary>If you're using multiple devices, e.g., a combination of standalone and extender devices, click here to expand additional setup instructions.</summary>

  By default, the script only integrates a single device.
  However – just like the default Cubase MCU integration – you can configure it to work with multiple devices (i.e., extenders or additional standalone devices).

  To use a combination of multiple devices, open the script file with a text editor and find the line reading `devices: ["main"]` at the top of the script.
  This is where you can configure your devices.
  For instance, to use a main unit and an extender unit, replace `devices: ["main"]` with `devices: ["extender", "main"]` (or `devices: ["main", "extender"]` if you have your extender on the right side of the main device) and save the file.

  > **Note** Cubase does not expect scripts to change their port definitions over time – which is what happens when you edit the `devices` config option.
  > If you load a project in which you were previously using the script with a different `devices` configuration, Cubase might not properly detect your devices' MIDI ports and your devices might stay unresponsive.
  > In that case, try [disabling and re-enabling](#how-to-disable-and-re-enable-a-controller-script) the controller script in the MIDI Remote Manager to make Cubase forget the previous port configuration.

  > **Note** Most extender devices will let you choose an extender number (1,2,3,...) which will affect the MIDI port names assigned to them.
  > If you have only one extender, make sure it is configured as extender 1.
  > For multiple extenders, assign extender numbers from left to right.
  > Some extenders (e.g., Behringer X-Touch Extender) do not give you this choice.
  > If you use more than one of these extenders and have the ability to freely assign your port names (for instance using MIDI over ethernet), assign the port names according to the following pattern:
  >
  > - Extender 1: "X-Touch-Ext" (default extender port name)
  > - Extender 2: "X-Touch-Ext2" (default extender port name + "2")
  > - Extender 3: "X-Touch-Ext3" (default extender port name + "3")
  > - ...

  </details>

- Finally, restart Cubase to make it pick up the script.

The script detects your device(s) based on MIDI port names.
If you are using a standalone device (main or extender) or one main device with one or multiple extender(s), Cubase should automatically set up the MIDI Remote.
Alternatively, you can manually add it by clicking the "+" button in the lower zone's MIDI Remote pane and selecting vendor, device, and input/output ports yourself.

## Configuration Options

The very top of the MIDI Remote script file declares a number of configuration options.
You can edit these options with a text editor to match your preferences.
Each option is documented in a comment above it.
For an overview of all options, please refer to the [source code on GitHub](https://github.com/bjoluc/cubase-xtouch-midiremote/blob/main/src/config.ts#L32).

## Mapping

The mapping is similar to [Cubase's default Mackie MCU Pro mapping](https://download.steinberg.net/downloads_software/documentation/Remote_Control_Devices.pdf), with the following exceptions:

> [!NOTE]
> In the rest of this document, all buttons except the six encoder assign buttons are referred to by their Cubase MCU mapping labels.
> I recommend using a Cubase overlay for your device, unless your device already has the Cubase labels printed on it, like the iCON QCon Pro G2.
> Alternatively, page 7 of [Cubase's remote control devices documentation](https://download.steinberg.net/downloads_software/documentation/Remote_Control_Devices.pdf) provides a Mackie MCU Pro overlay which you can use to figure out the Cubase button labels for your device.

**Encoder Assignments**

- The lower scribble strip row always shows track names since they are vital to using each channel's buttons and fader, regardless of the encoder assignment. Parameter page numbers are displayed on the otherwise unused two-digit Assignment display instead. If an encoder assignment only has one parameter page, the Assignment display remains blank.
- Shift-pushing an encoder resets its parameter to the default value, if a static default value is known.
- The "Track" encoder assignment has additional parameter pages for Low Cut, High Cut, and the Track Quick Controls of the selected track.
- By default, pushing encoders in the "Pan/Surround" encoder assignment resets a channel's panner instead of toggling its "Monitor Active" state. If you'd like to toggle "Monitor Active" instead, you can set the `resetPanOnEncoderPush` [config option](#configuration-options) to `false`.
- You can enable and disable EQ bands by pushing their encoders – with one exception: Pushing an EQ gain encoder inverts the EQ gain.
- Instead of spreading the "Send" encoder assignment options out on four parameter pages, there are only two pages for sends now. The "Level" and "On" pages have been combined into a single page where turning encoders modifies the send level and pushing encoders toggles a send slot's On/Off status. The "Pre/Post" page remains untouched, and the "Bus" page is omitted because the MIDI Remote API doesn't expose send busses. If your Cubase version supports it, there are also four additional pages for Cue sends 1-4.
- The "Plug-In" encoder assignment always follows the currently focused plugin window to avoid tedious plugin selection via push encoders.
- The first page of the "Inst" encoder assignment maps encoders to the VST Quick Controls of the currently selected instrument track. The remaining pages map 8 encoders to each part of the channel strip, i.e., gate, compressor, tools, saturation, and limiter. Pushing the last encoder of a channel strip effect toggles the effect's bypass status.

The table below summarizes all available encoder assignments:

<!-- prettier-ignore -->
| MCU button label | Cubase button label | Available parameter pages |
| --- | --- | --- |
| **Track** | First | <ol><li>Monitor</li><li>Pre Gain</li><li>Phase</li><li>Low-Cut Frequency / Enabled</li><li>High-Cut Frequency / Enabled</li><li>Selected Track Quick Controls</li></ol> |
| **Pan/Surround** | Pan | Pan |
| **EQ** | EQ | <ul><li>EQ Bands 1 & 2 (8 encoders)</li><li>EQ Bands 3 & 4 (8 encoders)</li></ul> |
| **Send** | Last | <ul><li>Send Levels / Enabled (8 encoders)</li><li>Send Pre/Post (8 encoders)</li><li>Cue 1 Send Level / Enabled</li><li>Cue 2 Send Level / Enabled</li><li>Cue 3 Send Level / Enabled</li><li>Cue 4 Send Level / Enabled</li></ul> |
| **Plug-In** | Plug-Ins | All Remote Control Editor parameter pages of the currently focused plugin (all encoders) |
| **Instrument** | Dyn/FX/Aux | <ul><li>Remote Control Editor parameters of the selected track's VST instrument (all encoders)</li><li>Channel Strip Gate (8 encoders)</li><li>Channel Strip Compressor (8 encoders)</li><li>Channel Strip Tools (8 encoders)</li><li>Channel Strip Saturation (8 encoders)</li><li>Channel Strip Limiter (8 encoders)</li></ul> |

**Buttons**

- Like in the MCU default mapping, the 8 channel type buttons apply MixConsole channel visibility presets 1-8. In the likely case that you don't want to waste 8 prominent buttons for loading visibility presets, feel free to re-assign some buttons in the MIDI Remote Mapping Assistant.
- The Channel Left/Right buttons move the fader bank left/right by one channel instead of navigating between encoder assignment pages. The latter can be achieved by pressing the respective Encoder Assign button multiple times to cycle through the available assignment pages in a round-robin fashion, or by using the Channel Left/Right buttons while holding the Shift button.
- Pressing "Shift + Bank Left" navigates to the first (=leftmost) mixer bank.
- Pressing "Shift" + "Rewind"/"Forward" moves the cursor to the project's start/end position.
- Pressing "Shift + Edit" closes all **plugin** windows instead of only the currently active window (I couldn't find a command to "close the currently active window").
- The "Instrument" and "Master" buttons are assigned to the handy MixConsole History Undo and Redo commands, respectively. In the default MCU mapping, they would activate instrument and main insert effects encoder assignments. However, these can already be reached via the "Inst" and "Plug-In" encoder assign buttons, so I decided to use the buttons differently.
- For the same reason, the "Sends" button doesn't activate a send effects encoder assignment. Instead, it turns the rightmost push encoder and the jog wheel into controllers for the value that's currently under the mouse cursor – like the Steinberg CC121's AI knob.
- Pressing "Shift + Display Name/Value" flips the scribble strip display rows

**Miscellaneous**

- In zoom mode, the jog wheel zooms in and out instead of moving the cursor

## Drawbacks

Current limitations of the MIDI Remote API:

- The "Track" encoder assignment is missing the "Input Bus" and "Output Bus" pages which are not exposed by the MIDI Remote API.
- The "Pan/Surround" encoder assignment is missing a second page for vertical panning which is not exposed by the MIDI Remote API.
- The "Send" encoder assignment doesn't include a "Bus" page because send busses are not exposed by the MIDI Remote API.
- The "Plug-In" encoder assignment doesn't display the number of the active parameter page because it is not exposed by the MIDI Remote API.
- The "Inst" encoder assignment doesn't allow loading/switching channel strip plugins because the MIDI Remote API doesn't provide options for it.
- The punch button doesn't light up when "Auto Punch In" is activated – no host value available
- The global "Solo" LED and the "Solo Defeat" button don't light up when a channel is in solo mode – no host value available
- Channel visibility presets do not yet affect channel assignments since the `MixerBankZone` of the MIDI Remote API doesn't respect channel visibility presets (["`.setFollowVisibility()` is a teaser for future updates"](https://forums.steinberg.net/t/820531/2)).
- The function buttons F1-F8 can only have one assignment per button, no matter whether "Shift" is held or not ("Shift" activates a sub page and the Mapping Assistant doesn't consider sub pages)
- When in mouse value control mode, the encoder's LED ring is not updated to single-dot mode but remains in whatever mode the currently active encoder assignment demands (blocked by https://forums.steinberg.net/t/831123).

## Supplementary Remarks for Individual Scripts

<details>
<summary>Behringer X-Touch One</summary>

- The X-Touch One script does not provide a `devices` config option. If you want to use an X-Touch One with an extender, please use the X-Touch One script and the X-Touch script separately.
- The X-Touch One does not have encoder assign buttons. To make up for this, the F1 button is mapped to cycle through the following encoder assignments:
  - **1** Pan
  - **2** Monitor
  - **3** Pre Gain
  - **4** Low-Cut Frequency / Enabled
  - **5** High-Cut Frequency / Enabled
  - **6** Send Slot 1 Level / Active
  - **7** Send Slot 2 Level / Active
  - **8** Send Slot 3 Level / Active
- The F3 button turns the push encoder and the jog wheel into controllers for the value that's currently under the mouse cursor – like the Steinberg CC121's AI knob.
- The F4 button is mapped as "Shift".

</details>

<details>
<summary>iCON Platform M+</summary>

- The Mixer button is mapped as Shift
- The Platform M+ does not have encoder assign buttons. Instead, pressing the Channel Left/Right buttons while holding Shift (Mixer) allows to navigate through a number of encoder assignments. Those are:
  - Pan
  - Monitor
  - Pre Gain
  - Low-Cut Frequency / Enabled
  - High-Cut Frequency / Enabled
  - Focused Quick Controls
  - EQ Bands 1 & 2 (8 encoders), EQ Bands 3 & 4 (8 encoders)
  - Send Levels / Enabled (8 encoders), Send Pre/Post (8 encoders)
  - Channel Strip Gate (8 encoders), Compressor (8 encoders), Tools (8 encoders), Saturation (8 encoders), Limiter (8 encoders)

</details>

<details>
<summary>iCON V1-M / V1-X</summary>

The iCON V1-M has a touch screen button matrix with customizable button labels (via the iMAP software).
The mappings of the MIDI Remote Script are available as an iMAP DAW mapping that you can [download](assets/mcu-midiremote.v1m-daw) and load into iMAP (right-click > "Load DAW mapping") so the button layout on the V1-M matches the layout of the MIDI Remote control surface.
When you customize your mappings in the Cubase MIDI Remote Mapping Assistant, you can use the iMAP software to update the labels on the V1-M.
The default mapping assigns each button of the first three function layers (blue, green, yellow) to a corresponding virtual button on the MIDI Remote control surface.
Presuming the provided iMAP DAW mapping has been loaded, the following aspects of the V1-M script differ from the mapping described above:

- All buttons are labelled according to their actual functions (even if these functions differ from the default MCU functions).
- The first (blue) function layer exposes three buttons that are not available in Cubase's default MCU mapping: Edit Instrument, Reset Meters, and Click.
- There is no additional touchscreen button for controlling the value under the mouse cursor because the controller can already do this via the Focus button top-right of the jog wheel.
- The secondary scribble strips show track names and peak meter levels. While a track's fader is touched, its scribble strip switches to the fader's current parameter name and parameter value instead, unless the Shift button is held.
- All encoder assign buttons are located on the second (green) function layer and there are more encoder assign buttons than traditional MCU devices have: The encoder assignments from the table in the previous section have mostly been split across individual buttons to make them easier to access. The only encoder assignments which you can page through by pressing the assign button multiple times are EQ, Sends, and Focused Insert.

Lastly, thanks to iCON for supporting the development of this script variant!

</details>

<details>
<summary>SSL UF1</summary>

- The UF1 script does not provide a `devices` config option.
- The first encoder page of the "STRIP" encoder assignment ("Instrument" in the encoder assignment table above) maps the V-Pots to the Focus Quick Controls instead of the selected track's instrument. It is enabled by default to assign a consistent and useful function to the four V-Pots out of the box.

</details>

## Troubleshooting

Having issues with the scripts? Here are some common problems and potential solutions you should try before reporting an issue:

### Some buttons do not work as expected

You can re-map most surface elements (buttons, faders, encoders) using the MIDI Remote Mapping Assistant in Cubase.
Those mappings are stored as JSON files in a `User Settings` folder at `Documents/Steinberg/Cubase/MIDI Remote/User Settings`, next to the MIDI Remote `Driver Scripts` folder.
If some button/fader/encoder isn't working as expected – especially after an update to the script – it is always worth a try to remove the user setting files (those starting with your script's name) to make sure they don't interfere with the script's default functionality.
Afterwards, restart Cubase to reload the MIDI Remote scripts and settings.

If that still didn't help, [disabling and re-enabling](#how-to-disable-and-re-enable-a-controller-script) the controller script can solve some mapping issues as well.

### Some displays are lagging or faders are stuttering heavily when reading automation

This might be caused by another source sending MIDI data to your device, for instance Cubase's default Mackie Control remote device integration.
Make sure you have removed all Mackie Control remote devices in the studio setup window, or that you have selected "Not Connected" for their ports.

### The SMPTE/Beats button doesn't change the time format

The SMPTE/Beats button is mapped to the "Exchange Time Formats" command which switches between the primary and secondary time format.
The button has no effect when both time formats are identical, so make sure you have selected different primary and secondary time formats.

### One or multiple devices are unresponsive

Try [disabling and re-enabling](#how-to-disable-and-re-enable-a-controller-script) the controller script in the MIDI Remote Manager to make Cubase re-detect the script's MIDI ports.
If that doesn't solve it and the unresponsive device is connected via network MIDI, it might help to [configure a lower bitrate](https://github.com/bjoluc/cubase-mcu-midiremote/issues/27#issuecomment-1930624505).

### How to disable and re-enable a controller script?

![How to disable and re-enable a controller script](images/disable-enable-controller-script.gif)
