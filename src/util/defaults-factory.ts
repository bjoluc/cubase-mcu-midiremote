/**
 * A (nested) object that has only function properties. Each function property can be used to
 * initialize a default value for another object's undefined property with the same path.
 */
export type DefaultsFactory = (() => any) | { [key: string]: DefaultsFactory };

/**
 * Given two (nested) objects – a target object and a {@link DefaultsFactory} object – traverses
 * both objects and for every path that is defined in the factory object and undefined in the target
 * object, invokes the factory object's function at that path, subsequently applying the resulting
 * property value to the target object. Returns the modified target object.
 */
export function applyDefaultsFactory(
  targetObject: Record<string, any> | undefined,
  defaultsFactory: DefaultsFactory,
) {
  if (typeof defaultsFactory === "function") {
    return typeof targetObject === "undefined" ? defaultsFactory() : targetObject;
  }
  if (typeof targetObject === "undefined") {
    targetObject = {};
  }

  for (const key of Object.keys(defaultsFactory)) {
    targetObject[key] = applyDefaultsFactory(targetObject[key], defaultsFactory[key]);
  }

  return targetObject;
}
