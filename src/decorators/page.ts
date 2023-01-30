interface SettableHostValueUndefined extends MR_HostValueUndefined {
  setProcessValue: (activeDevice: MR_ActiveDevice, value: number) => void;
}

export interface DecoratedFactoryMappingPage extends MR_FactoryMappingPage {
  mCustom: MR_FactoryMappingPage["mCustom"] & {
    makeSettableHostValueVariable: (name: string) => SettableHostValueUndefined;
  };
}

export function decoratePage(page: MR_FactoryMappingPage, surface: MR_DeviceSurface) {
  const enhancedPage = page as DecoratedFactoryMappingPage;

  enhancedPage.mCustom.makeSettableHostValueVariable = (name: string) => {
    const hostValue = page.mCustom.makeHostValueVariable(name) as SettableHostValueUndefined;
    const surfaceValue = surface.makeCustomValueVariable(`${name}SurfaceValue`);

    page.makeValueBinding(surfaceValue, hostValue);
    hostValue.setProcessValue = (activeDevice, value) =>
      surfaceValue.setProcessValue(activeDevice, value);

    return hostValue;
  };

  return enhancedPage;
}
