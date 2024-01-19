/**
 * Extends `page.makeCommandBinding()` to also accept `undefined` in place of a surface variable.
 */
export function makeOptionalCommandBinding(
  page: MR_FactoryMappingPage,
  surfaceValue: MR_SurfaceValue | undefined,
  commandCategory: string,
  commandName: string,
  bindingConfigurator: (binding: MR_CommandBinding) => void,
) {
  if (surfaceValue) {
    bindingConfigurator(page.makeCommandBinding(surfaceValue, commandCategory, commandName));
  }
}
