import { Resource } from '@angular/core';

export function valueOr<T>(resource: Resource<T>, fallback: T): T {
  return resource.hasValue() ? resource.value() : fallback;
}
