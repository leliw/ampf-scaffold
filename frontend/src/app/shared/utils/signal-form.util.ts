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
