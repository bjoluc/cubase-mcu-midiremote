# Contributing

Thanks for your interest in improving cubase-mcu-midiremote!
This document describes how to set up a development environment, build the scripts, and test them in Cubase.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS) and npm
- A Cubase version ≥ 12.0.52 to test the scripts on your device
- Git

## Setup

```sh
git clone https://github.com/bjoluc/cubase-mcu-midiremote.git
cd cubase-mcu-midiremote
make install
```

The repository ships a `Makefile` that wraps the common tasks.
Run `make` (or `make help`) to list all available targets:

| Target                | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `make install`        | Install npm dependencies                                               |
| `make build`          | Build all device scripts into `dist/`                                  |
| `make watch`          | Build and rebuild on file changes                                      |
| `make api`            | Copy Cubase's MIDI Remote API types into `.api/` (needed to typecheck) |
| `make typecheck`      | Run the TypeScript type checker                                        |
| `make format`         | Format all files with Prettier                                         |
| `make format-check`   | Check that all files are formatted with Prettier                       |
| `make cubase-install` | Build and copy the scripts into Cubase's MIDI Remote drivers folder    |
| `make clean`          | Remove the `dist/` folder                                              |

## Building

`make build` compiles every device configuration in `src/device-configs/` into its own standalone ES5 script under `dist/<vendor>/<device>/`.
For example, the X-Touch One script is written to `dist/behringer/x-touch-one/behringer_x-touch-one.js`.

By default, the generated scripts use the `devices: ["main"]` configuration.
Set the `DEVICES` environment variable to change this default, e.g.:

```sh
DEVICES='["extender", "main"]' make build
```

## Type checking

The type checker needs Steinberg's MIDI Remote API type definitions, which ship with Cubase and are not part of this repository.
Once Cubase has been launched at least once, they are located in the `.api` folder next to your MIDI Remote `Driver Scripts` folder:

- macOS: `~/Documents/Steinberg/Cubase/MIDI Remote/Driver Scripts/.api`
- Windows: `%USERPROFILE%\Documents\Steinberg\Cubase\MIDI Remote\Driver Scripts\.api`

Copy that folder into the repository root (it is git-ignored) with:

```sh
make api
```

If your folder differs, override `CUBASE_API_DIR` (it defaults to the `.api` folder next to `CUBASE_SCRIPTS_DIR`) and then run `make typecheck`.

## Testing in Cubase

`make cubase-install` builds the scripts and copies them into Cubase's MIDI Remote `Driver Scripts/Local` folder.
It defaults to the standard macOS location:

```text
~/Documents/Steinberg/Cubase/MIDI Remote/Driver Scripts/Local
```

If your folder differs, override `CUBASE_SCRIPTS_DIR`:

```sh
CUBASE_SCRIPTS_DIR="/path/to/Driver Scripts/Local" make cubase-install
```

Cubase loads scripts on startup, so restart it after installing.
For a faster edit/build loop, run `make watch` in a terminal, or set the `COPY_COMMAND` environment variable to a shell command that is executed after each build.

## Project structure

```text
src/
  config.ts          Configuration options prepended to every generated script
  device-configs/    One file per supported vendor/device combination
  devices/           Main and extender device abstractions
  mapping/           Host mappings (buttons, encoders, ...)
  midi/              MIDI binding and display/color managers
  decorators/        Surface element decorators (buttons, faders, ...)
```

## Submitting changes

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, `docs:`, `chore:`, ...) because releases and the changelog are generated from them.
Create a branch, make your changes, verify with `make build`, `make format-check` (and `make typecheck` if possible), test on your hardware, and open a pull request.
