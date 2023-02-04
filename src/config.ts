import { Except, Simplify } from "type-fest";

export type DevicesConfiguration = Array<"main" | "extender">;

export type ScriptConfiguration = Simplify<
  Except<typeof CONFIGURATION, "devices"> & {
    devices: DevicesConfiguration;
  }
>;

// @ts-expect-error
export const config = CONFIGURATION as ScriptConfiguration;

// Everything below "BEGIN JS" is copied directly to the top of the build file (with some values
// being replaced).

// BEGIN JS
/**
 * Script configuration – edit the following options to match your preferences
 */
var CONFIGURATION = {
  /**
   * If you have an extender unit, change this to either `["extender", "main"]` (if your extender is
   * placed on the left side of the main unit) or `["main", "extender"]` (if the extender is on the
   * right side).
   *
   * Do you have more than one extender? Let me know and I'll add support for multiple extenders!
   */
  devices: ["main"],
};
