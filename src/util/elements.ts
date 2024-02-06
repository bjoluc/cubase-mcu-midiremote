export function createElements<E>(count: number, factoryFunction: (index: number) => E): E[] {
  const elements = [];
  for (let index = 0; index < count; index++) {
    elements.push(factoryFunction(index));
  }

  return elements;
}

/**
 * Given an array and a list of array indices, returns a new array consisting of the elements at the
 * original indices specified by the `indices` list.
 */
export function getArrayElements<T>(array: T[], indices: number[]) {
  return indices.map((index) => array[index]);
}
