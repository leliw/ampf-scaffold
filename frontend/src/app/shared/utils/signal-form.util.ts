import { validate } from '@angular/forms/signals';


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mergeWithDefaults<T extends Record<string, unknown>>(defaults: T, values: unknown): T {
  if (!isRecord(values)) {
    return { ...defaults };
  }

  const result: Record<string, unknown> = { ...defaults };

  for (const key of Object.keys(defaults)) {
    const value = values[key];

    if (value !== null && value !== undefined) {
      result[key] = value as T[typeof key];
    }
  }

  return result as T;
}

export function removeEmptyValues<T extends object>(object: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== '' && value !== null && value !== 0
    )
  ) as Partial<T>;
}

export function getChangedData<T extends object>(original: T, current: T): Partial<T> {
  const changes: Partial<T> = {};

  for (const key of Object.keys(current) as Array<keyof T>) {
    if (!isEqual(current[key], original[key])) {
      setChange(changes, key, current[key]);
    }
  }
  return changes;
}

function setChange<T, K extends keyof T>(
  changes: Partial<T>,
  key: K,
  value: T[K]
): void {
  changes[key] = value;
}

function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

interface UrlOptions {
  message?: string;
  protocols?: readonly string[];
}

export function validUrl(
  field: Parameters<typeof validate>[0],
  options: UrlOptions = {},
): void {
  const message = options.message ?? 'Invalid URL';
  const protocols = options.protocols ?? ['http:', 'https:'];

  validate(field, ({ value }) => {
    const rawValue = value();

    // Pole opcjonalne — wymagalność obsługuje required()
    if (rawValue == null || String(rawValue).trim() === '') {
      return null;
    }

    try {
      const url = new URL(String(rawValue));

      if (!protocols.includes(url.protocol)) {
        return { kind: 'invalidUrl', message };
      }

      return null;
    } catch {
      return { kind: 'invalidUrl', message };
    }
  });
}
