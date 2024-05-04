import * as dotenv from "dotenv";
import { execaCommand } from "execa";
import { extract, parse } from "jest-docblock";
import { readFileSync, readdirSync } from "node:fs";

import slugify from "@sindresorhus/slugify";
import { resolve } from "node:path";
import prependFile from "prepend-file";
import { defineConfig } from "tsup";

dotenv.config();
const copyCommand = process.env.COPY_COMMAND;
const devicesConfiguration = process.env.DEVICES ?? '["main"]';

// Read src/config.ts and prepare the configuration section to be prepended to script files
const configFileContents = readFileSync("src/config.ts", { encoding: "utf-8" });
const scriptConfig = /BEGIN JS(?:\r?\n|\r)([\s\S]+)/
  .exec(configFileContents)![1]
  .replace('devices: ["main"]', `devices: ${devicesConfiguration}`);

// Create a list of all available device configurations and their target directory names by
// enumerating the `src/devices` directory and parsing all `vendor` and `device` pragmas of the
// files therein.
const deviceConfigsDir = "./src/device-configs/";
const devices = readdirSync(deviceConfigsDir)
  .map((filename) => ({
    ...(parse(extract(readFileSync(deviceConfigsDir + filename, { encoding: "utf-8" }))) as {
      vendor: string;
      device: string;
    }),
    deviceConfigFilename: filename,
  }))
  .filter(({ vendor, device }) => vendor && device)
  .map(({ deviceConfigFilename, vendor, device }) => {
    const vendorFolder = slugify(vendor, { decamelize: false });
    const deviceFolder = slugify(
      device.replace(/^X-Touch$/, "xtouch"), // for setup instructions backwards compatibility
      { decamelize: false },
    );

    return {
      deviceConfigFilename,
      vendor,
      device,
      targetFilename: `${vendorFolder}_${deviceFolder}`,
      targetPath: `dist/${vendorFolder}/${deviceFolder}`,
    };
  });

export default defineConfig(
  devices.map((device) => ({
    entry: { [device.targetFilename]: "src/index.ts" },
    outDir: device.targetPath,
    clean: true,
    external: ["midiremote_api_v1"],
    onSuccess: async () => {
      // Remove all config options with a non-matching `@devices` pragma
      const deviceSpecificScriptConfig = scriptConfig.replace(
        /(?:\r?\n|\r)\s*\/\*\*\s*(?:\r?\n|\r)(?:[^\*]|(?:\*(?!\/)))*@devices ([\S ]+)(?:\r?\n|\r)\s+\*\/(?:\r?\n|\r)[\S ]+/gm,
        (match, devicesPragma: string) => {
          // Remove devices pragma from match
          match = match.replace(/\*(\r?\n|\r)([\S ]+)(\r?\n|\r)*@devices [\S ]+(\r?\n|\r)\s+/, "");

          const supportedDevices = devicesPragma.split(", ");
          if (devicesPragma.includes("!")) {
            // Negative mode – include everything *but* the specified device(s)
            return supportedDevices.includes("!" + device.device) ? "" : match;
          }

          return supportedDevices.includes(device.device) ? match : "";
        },
      );

      await prependFile(
        `${device.targetPath}/${device.targetFilename}.js`,
        deviceSpecificScriptConfig,
      );

      if (copyCommand) {
        await execaCommand(copyCommand, { shell: true, stdout: process.stdout });
      }
    },
    define: {
      SCRIPT_VERSION: `"${process.env.npm_package_version}"`,
      DEVICE_NAME: `"${device.device}"`,
      VENDOR_NAME: `"${device.vendor}"`,
    },
    target: "es5",
    esbuildPlugins: [
      {
        name: "device-config-loader",
        setup(build) {
          build.onResolve({ filter: /^current-device$/ }, () => ({
            path: resolve(deviceConfigsDir + device.deviceConfigFilename),
          }));
        },
      },
    ],
  })),
);
