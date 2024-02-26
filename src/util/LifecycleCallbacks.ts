import { CallbackCollection, makeCallbackCollection } from "./callback-collection";

export class LifecycleCallbacks {
  addActivationCallback: CallbackCollection<[MR_ActiveDevice]>["addCallback"];
  addDeactivationCallback: CallbackCollection<[MR_ActiveDevice]>["addCallback"];

  constructor(driver: MR_DeviceDriver) {
    this.addActivationCallback = makeCallbackCollection(driver, "mOnActivate").addCallback;
    this.addDeactivationCallback = makeCallbackCollection(driver, "mOnDeactivate").addCallback;
  }
}
