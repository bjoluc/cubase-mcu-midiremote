import type { Entries } from "type-fest";

declare global {
  interface ObjectConstructor {
    entries<T extends object>(o: T): Entries<T>;
  }

  declare var performance: {
    now: () => number;
  };

  // Constants that are replaced with strings at build time
  declare const VENDOR_NAME: string;
  declare const DEVICE_NAME: string;
  declare const SCRIPT_VERSION: string;
}
