import * as dotenv from "dotenv";
import { execaCommand } from "execa";
import prependFile from "prepend-file";
import { build } from "tsup";
import { readFile } from "node:fs/promises";

dotenv.config();
const copyCommand = process.env.COPY_COMMAND;
const devices = process.env.DEVICES ?? '["main"]';

build({
  watch: process.argv.includes("--watch"),
  entry: { behringer_xtouch: "src/index.ts" },
  outDir: "dist/behringer/xtouch",
  clean: true,
  external: ["midiremote_api_v1"],
  noExternal: ["abbreviate", "core-js"],
  onSuccess: async () => {
    const configFileContents = (await readFile("src/config.ts")).toString("utf8");

    const scriptConfig = /BEGIN JS\n([\s\S]+)/
      .exec(configFileContents)[1]
      .replace('devices: ["main"]', `devices: ${devices}`);

    await prependFile("dist/behringer/xtouch/behringer_xtouch.js", scriptConfig + "\n\n");

    if (copyCommand) {
      await execaCommand(copyCommand, { shell: true, stdout: process.stdout });
    }
  },
  define: {
    SCRIPT_VERSION: `"${process.env.npm_package_version}"`,
  },
  target: "es5",
});
