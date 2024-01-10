# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.9.0](https://github.com/bjoluc/cubase-mcu-midiremote/compare/v1.8.0...v1.9.0) (2024-01-10)


### Features

* Allow inverting EQ gain by shift-pressing EQ gain encoders ([370ed12](https://github.com/bjoluc/cubase-mcu-midiremote/commit/370ed12b8ef41b5831b4b22f7411ef7c711eb95f)), closes [#17](https://github.com/bjoluc/cubase-mcu-midiremote/issues/17) [#17](https://github.com/bjoluc/cubase-mcu-midiremote/issues/17)
* Implement port auto detection for all setups with one main and one extender device ([e08fb09](https://github.com/bjoluc/cubase-mcu-midiremote/commit/e08fb09a457911cffe33cbddbaf44069bb047eb6))
* Make encoder values with known defaults resettable by shift-pushing encoders ([57f4898](https://github.com/bjoluc/cubase-mcu-midiremote/commit/57f4898a001d278bdd7b7e135a7324043550fdd4))
* Reset channel panners on encoder push, unless `resetPanOnEncoderPush` is set to `false` ([bbd4368](https://github.com/bjoluc/cubase-mcu-midiremote/commit/bbd4368ebbe4627cbdc8b360ef0ed46d0b1749e3))

## [1.8.0](https://github.com/bjoluc/cubase-mcu-midiremote/compare/v1.7.0...v1.8.0) (2023-11-17)


### Features

* Add a `channelVisibility` config option to simplify channel type visibility control ([812fe2f](https://github.com/bjoluc/cubase-mcu-midiremote/commit/812fe2fa7a93179a7d98f2cdb6b0fc7dce031efe))
* **Cubase 13 only:** Add proper fader touch support for automation writing ([e79ccab](https://github.com/bjoluc/cubase-mcu-midiremote/commit/e79ccab3a1df81d7e56b02b84a153a61c88ec1d3))
* Make the jog wheel zoom in and out when zoom mode is active ([ff6c0ff](https://github.com/bjoluc/cubase-mcu-midiremote/commit/ff6c0ff5fe804d12abc1fc385b6c94bfa50ada9f))
* **X-Touch:** Enhance device surface layout to match the CGI product image ([1e8c74d](https://github.com/bjoluc/cubase-mcu-midiremote/commit/1e8c74d1c23531dda5a1b3f334135440f5af7abf))
* **X-Touch:** Replace the `useEncoderColors` config flag with a more advanced `displayColorMode` option, also making it possible to disable display color management altogether ([d8d5eec](https://github.com/bjoluc/cubase-mcu-midiremote/commit/d8d5eec996291e13ba485cf5451a0d455b5f42c1))


### Bug Fixes

* **Cubase 13 only:** Avoid occasional lags while modifying parameters ([454a4dd](https://github.com/bjoluc/cubase-mcu-midiremote/commit/454a4dd15f0397ae6cc4be1fbb92f1280ff88e31))
* **X-Touch:** Fall back to white displays for assigned encoders on unassigned channels when the script is configured to use channel colors only ([07e4592](https://github.com/bjoluc/cubase-mcu-midiremote/commit/07e4592e876f94611c3400b2a34280ffdfa934e3))

## [1.7.0](https://github.com/bjoluc/cubase-mcu-midiremote/compare/v1.6.0...v1.7.0) (2023-09-21)


### Features

* Add a Mackie MCU Pro script variant ([#11](https://github.com/bjoluc/cubase-mcu-midiremote/issues/11)) – thanks @JDubs73 and @Support-AT for testing! ([25508c4](https://github.com/bjoluc/cubase-mcu-midiremote/commit/25508c4ef4f58f1d247e0a882cf7b5020316ee3d))
* Make "Shift + Display Name/Value" flip the scribble strip display rows ([dfd2453](https://github.com/bjoluc/cubase-mcu-midiremote/commit/dfd245378a0322bb88fcdb3b8b98c2a736fe713d))
* **Mapping:** Make "Shift + Bank Left" navigate to the first mixer bank ([b9b3042](https://github.com/bjoluc/cubase-mcu-midiremote/commit/b9b30423453610d26ab00c34589f7366003c9802))
* **X-Touch:** Add `useEncoderColors` config option ([e98f414](https://github.com/bjoluc/cubase-mcu-midiremote/commit/e98f414eb1b6f2c7f2f1aef7ba6c7086bcfbab6e))


### Bug Fixes

* Allow custom assignments of the Motor button ([1da391b](https://github.com/bjoluc/cubase-mcu-midiremote/commit/1da391b001bbd4969b1e5452fb000d9e0dc75aa7))
* Fix invalid note-on messages for future Cubase versions ([c7d5597](https://github.com/bjoluc/cubase-mcu-midiremote/commit/c7d559724e0e4de378ddd3ad111f6f98ddd00758)), closes [#15](https://github.com/bjoluc/cubase-mcu-midiremote/issues/15)
* **X-Touch:** Fix an issue where loading an empty project would not turn off the display backlights ([acccbc0](https://github.com/bjoluc/cubase-mcu-midiremote/commit/acccbc03d6803989d6acd2889296fdc35071dd1d)), closes [#12](https://github.com/bjoluc/cubase-mcu-midiremote/issues/12)

## [1.6.0](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.5.0...v1.6.0) (2023-07-05)


### Features

* Add low-cut and high-cut filter pages to the "Track" encoder assign button ([6551319](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/6551319a58912ed8efd00cf932e22c111006a3b0))
* Add support for the iCON QCon Pro G2 ([#7](https://github.com/bjoluc/cubase-xtouch-midiremote/issues/7)) ([ee4a800](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/ee4a8009830f73ab02591449e432e7175147a2e0))
* Add Track Quick Controls page to "Track" encoder assignment ([a0a697c](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/a0a697cc7500f556f5326654db6ab610d0e483e5))
* **X-Touch:** Extend port detection by ports named "X-Touch INT" ([d25b2ff](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/d25b2ff49a848d2e55c06957fb48f7e80f6c4f33))


### Bug Fixes

* Fix an issue where turning multiple devices' encoders at once would leave channel strip displays showing values instead of returning to the respective parameter names ([832a052](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/832a052277b2c69de0ea10e98b7878f290e4e023))
* Use VST Quick Controls in "Inst" encoder assignment instead of Track Quick Controls ([129cf46](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/129cf468e2e561a857ba77a99314f5e646f904a8))
* Work around the regressions introduced in Cubase 12.0.60 ([fd3a69b](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/fd3a69bc0d3e7a9e87d4c48ba95deb33d34c547c)), closes [#6](https://github.com/bjoluc/cubase-xtouch-midiremote/issues/6) [#5](https://github.com/bjoluc/cubase-xtouch-midiremote/issues/5)

## [1.5.0](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.4.2...v1.5.0) (2023-03-31)


### Features

* Add encoder assignments for channel strip plugins ([fad1e7a](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/fad1e7a1ca937a87ff219f0cd2a39081a051ea48))


### Bug Fixes

* Fix track titles not being updated in Cubase v12.0.60 ([cbf7c27](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/cbf7c2704d9dc589d6c64aeb7ae06a53b338f11e))
* Update time display and Beats/SMPTE LEDs on script activation ([ebcfa0f](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/ebcfa0f0d6130c8e283d1b28b8fa4c84aa587db5))

## [1.4.2](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.4.1...v1.4.2) (2023-03-22)


### Bug Fixes

* **Internationalization:** Improve LCD display usage in various languages ([b4ce7ce](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/b4ce7ce12b1998f79d747c1fef66b4417a252767))
* **Mapping:** Make "Shift + Left" and "Shift + Right" set the left and right locator, respectively ([8b08a7c](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/8b08a7cdc30e1e12c4ad2f0416bf2f1e7bd90e4d))

## [1.4.1](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.4.0...v1.4.1) (2023-03-17)


### Bug Fixes

* Make MIDI port names unique to fix an issue where Cubase would randomly swap identically named MIDI ports (such as multiple extender ports) ([b7a0659](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/b7a06590e87ed95d10064b314d06a5bbde3b47db)), closes [#4](https://github.com/bjoluc/cubase-xtouch-midiremote/issues/4)

## [1.4.0](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.3.1...v1.4.0) (2023-03-02)


### Features

* Support arbitrary device combinations – thanks [@lamusician](https://github.com/lamusician) and [@limageurpublic](https://github.com/limageurpublic) for testing! ([db82022](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/db82022b450ad63c85f6f48da595f7a0530b9b0f))


### Bug Fixes

* **Encoder Assignments:** Prevent unassigned encoders from falling back to their previous assignment ([bc39c0e](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/bc39c0ea2b4fad1474e904052f4b1de5f5156dad))

## [1.3.1](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.3.0...v1.3.1) (2023-02-22)


### Bug Fixes

* Fix visually incorrect scribble strip color mapping ([dc020b7](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/dc020b7de58eb7d1b5e146b896e575f6c6f1359d))

## [1.3.0](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.2.2...v1.3.0) (2023-02-14)


### Features

* Add `mapMainFaderToControlRoom` config flag that can be disabled to map the main fader to the first output channel's volume ([e782438](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/e782438958886526daba52b9c90e90a73911dbeb))
* Add support for foot switches and expression pedal ([ece432f](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/ece432fbf5ba082ac21cce740efe4fffe9f2b721))
* Enable time display to display arbitrary time formats, including "Samples" ([67b11dd](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/67b11dd6e9cb0fcc9ce0971f92a9830af7a28d98))
* Respect extender positioning in surface layout ([bb75d5a](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/bb75d5af58fc03fb26a55f7bd7fb44f72dab6078))
* Show encoder page count in the assignment display for encoder assignments with more than one parameter page ([0daff82](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/0daff82487d99a794a8b33bb1b7dffae7a3f096b))


### Bug Fixes

* Always use the rightmost push encoder of the *main* device for value-under-cursor control ([c526c24](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/c526c2466029475c24d38c6581b9b29236c31b92))

## [1.2.2](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.2.1...v1.2.2) (2023-02-13)


### Bug Fixes

* Disable channel auto select for flipped Plug-In and Instrument assignments ([d35745a](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/d35745a138576260bb00c7ef381039d04d9ad360))
* Fix Solo Defeat button mapping ([3ec0193](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/3ec0193a30970413b56eb94e25312ea0c4587f49))
* Make scribble strips fall back to their channel color when their encoder is unassigned ([9fe9618](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/9fe9618426428a956ea685339d9fdbf78184db6c))
* Shorten German pan encoder names ([0b664fc](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/0b664fc7b2eb4c3b825badaa8c1d99584d349ff4))

## [1.2.1](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.2.0...v1.2.1) (2023-02-04)


### Bug Fixes

* Patch an upstream issue which made some specific parameter names cause `TypeError`s (paulpflug/abbreviate#1) ([eac9133](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/eac9133a0afdb78cb0a740e61287cbff4e771c7c))

## [1.2.0](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.1.2...v1.2.0) (2023-02-04)


### Features

* Add `enableAutoSelect` config option ([296cf20](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/296cf202bdd19bd822e68ac166887bbb0ad61485))
* Move config to the top of the script, replacing `USE_EXTENDER` and `IS_EXTENDER_LEFT` with a new `devices` option ([d09b0c9](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/d09b0c902d6ae42567441a3c936dcdc4ac4705f9))

## [1.1.2](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.1.1...v1.1.2) (2023-02-03)


### Bug Fixes

* Disable LEDs of unassigned channel buttons and encoders ([c7a0974](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/c7a097439c692b71bfe569f7efb8f0d40ee3b7ef))

## [1.1.1](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.1.0...v1.1.1) (2023-02-02)


### Bug Fixes

* Fix faders not being sent up after paging to unassigned channels ([83734ba](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/83734babebbbc0e5412b807221b3fe65ce71e907))
* Fix faders not being set after reconnecting devices ([7e210e2](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/7e210e24d7cbb069b7df636865c7ae80fec6af6a))

## [1.1.0](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.0.1...v1.1.0) (2023-02-02)


### Features

* Enable the jog wheel for value control in mouse cursor value mode ([60bc20d](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/60bc20d5aa46391f80f45bef9a9f7402a24e59d2))
* Log script version and update notice on activation ([b303216](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/b303216ca7ae2ad37a8c82dae850f756b2bd055a))
* Switch scribble strip displays to value mode while their encoder values are being changed ([27a2987](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/27a29876039567c00f6dbf27bad1e04ca108f6cf))

## [1.0.1](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.0.0...v1.0.1) (2023-02-01)


### Bug Fixes

* Fix (de-)activation of EQ bands in EQ encoder assignment ([f05bb6f](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/f05bb6f7d85d35c3366de24a301a57f665dc739b))

## 1.0.0 (2023-01-31)


### Features

* Initial release ([2678163](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/267816391cbad8893c802c8f4d568f3325cda232))
