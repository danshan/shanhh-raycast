export function resolveBtsowUrl(pathname: string, host: string): string {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    throw new Error("Btsow path must be an absolute path on the configured host.");
  }

  const url = new URL(host);
  if (url.protocol !== "https:") {
    throw new Error("Btsow host must use HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("Btsow host must not contain credentials.");
  }

  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url.toString();
}
