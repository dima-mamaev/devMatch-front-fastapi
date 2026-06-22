export function setQueryParams(params?: unknown) {
  const urlSearchParams = new URLSearchParams();
  if (params) {
    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((item) => urlSearchParams.append(key, String(item)));
      } else {
        urlSearchParams.set(key, String(value));
      }
    });
  }
  return urlSearchParams.toString();
}
