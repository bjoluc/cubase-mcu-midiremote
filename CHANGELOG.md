# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
