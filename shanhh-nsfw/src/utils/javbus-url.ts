export function resolveJavbusRequestUrl(value: string, baseUrl: string): string {
  const base = new URL(baseUrl);
  const candidate = new URL(value, base);

  if (base.protocol !== "https:" || candidate.protocol !== "https:" || candidate.origin !== base.origin || candidate.username || candidate.password) {
    throw new Error("JavBus URL must use the configured HTTPS origin.");
  }

  return candidate.toString();
}
