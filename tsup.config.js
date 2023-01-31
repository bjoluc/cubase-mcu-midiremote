import * as dotenv from "dotenv";
import { defineConfig } from "tsup";

dotenv.config();
const copyCommand = process.env.COPY_COMMAND;

export default defineConfig((options) => {
  return {
    entry: { behringer_xtouch: "src/index.ts" },
    outDir: "dist/behringer/xtouch",
    clean: true,
    external: ["midiremote_api_v1"],
    noExternal: ["abbreviate", "core-js"],
    onSuccess:
      "echo 'Running Babel...' && babel dist/behringer/xtouch/behringer_xtouch.js --out-file dist/behringer/xtouch/behringer_xtouch.js" +
      (options.watch && copyCommand ? ` && ${copyCommand}` : ""),
    esbuildOptions(esbuildOptions, context) {
      esbuildOptions.define = {
        ...esbuildOptions.define,
        CONFIG_USE_EXTENDER: Boolean(options.watch).toString(),
      };
    },
  };
});
