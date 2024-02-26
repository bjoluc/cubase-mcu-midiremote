import { CallbackCollection } from "./CallbackCollection";

export class LifecycleCallbacks {
  addActivationCallback = new CallbackCollection(this.driver, "mOnActivate").addCallback;
  addDeactivationCallback = new CallbackCollection(this.driver, "mOnDeactivate").addCallback;

  constructor(private driver: MR_DeviceDriver) {}
}
