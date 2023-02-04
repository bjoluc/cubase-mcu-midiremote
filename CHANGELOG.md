# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.2.1](https://github.com/bjoluc/cubase-xtouch-midiremote/compare/v1.2.0...v1.2.1) (2023-02-04)


### Bug Fixes

* Patch an upstream issue which made some specific parameter names cause `TypeError`s (paulpflug/abbreviate[#1](https://github.com/bjoluc/cubase-xtouch-midiremote/issues/1)) ([eac9133](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/eac9133a0afdb78cb0a740e61287cbff4e771c7c))

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
* Prevent errors on undefined parameter titles and values ([421b9b2](https://github.com/bjoluc/cubase-xtouch-midiremote/commit/421b9b267a360244efa6909daff0e151c317e0ec))

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
