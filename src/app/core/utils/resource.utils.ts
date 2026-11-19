import { Resource } from '@angular/core';

/**
 * Reads a resource's value without throwing.
 *
 * `resource.value()` throws once a request has failed, even when the resource has a
 * `defaultValue`. Any `computed` reading it would then throw too and break the page,
 * instead of letting the template show the error state.
 *
 * @param resource The resource to read.
 * @param fallback What to return while the resource is in an error state.
 * @return The current value, or `fallback`.
 */
export function valueOr<T>(resource: Resource<T>, fallback: T): T {
  return resource.hasValue() ? resource.value() : fallback;
}
