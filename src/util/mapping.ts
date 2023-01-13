interface ExtendedFactoryMappingPage extends MR_FactoryMappingPage {
  /**
   * Makes `sourceObject.${sourceCallbackName}` invoke `targetCallback` when the page is active,
   * after the original source callback implementation has been run.
   */
  makeCallbackBinding: <O extends Record<string, any>, S extends keyof O>(
    sourceObject: O,
    sourceCallbackName: S,
    targetCallback: (...args: Parameters<O[S]>) => void
  ) => void;

  isActive: boolean;
}

export function makePage(driver: MR_DeviceDriver, pageName: string) {
  const page = driver.mMapping.makePage(pageName) as ExtendedFactoryMappingPage;
  page.isActive = false;

  page.mOnActivate = () => {
    page.isActive = true;
  };
  page.mOnDeactivate = () => {
    page.isActive = false;
  };

  page.makeCallbackBinding = function (sourceObject, sourceCallbackName, targetCallback) {
    type SourceCallback = typeof sourceObject[typeof sourceCallbackName];

    let sourceCallback: SourceCallback;
    try {
      sourceCallback = sourceObject[sourceCallbackName];
    } catch {}

    sourceObject[sourceCallbackName] = ((...args: Parameters<typeof targetCallback>) => {
      if (sourceCallback) {
        sourceCallback(...args);
      }
      if (page.isActive) {
        targetCallback(...args);
      }
    }) as SourceCallback;
  };

  return page;
}
