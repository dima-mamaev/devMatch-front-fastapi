type Getter = () => Promise<string | null>;

let currentGetter: Getter | null = null;

export function setTokenGetter(fn: Getter | null) {
  currentGetter = fn;
}

export async function getToken(): Promise<string | null> {
  if (!currentGetter) return null;
  try {
    return await currentGetter();
  } catch {
    return null;
  }
}
