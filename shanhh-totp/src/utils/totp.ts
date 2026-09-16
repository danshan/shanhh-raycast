import { Secret, TOTP } from "otpauth";

export interface OtpConfig {
  website: string;
  account: string;
  secret: string;
  icon?: string;
}

export interface TotpEntry extends OtpConfig {
  id: string;
  code: string;
  uri: string;
}

export function parseOtpConfigs(content: string): OtpConfig[] {
  const parsed: unknown = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error("TOTP configuration must be an array.");
  }

  return parsed.map((entry, index) => {
    if (typeof entry !== "object" || entry === null || !("website" in entry) || !("account" in entry) || !("secret" in entry) || typeof entry.website !== "string" || typeof entry.account !== "string" || typeof entry.secret !== "string" || !entry.website.trim() || !entry.account.trim() || !entry.secret.trim()) {
      throw new Error(`TOTP entry ${index + 1} is invalid.`);
    }

    return {
      website: entry.website.trim(),
      account: entry.account.trim(),
      secret: entry.secret.replaceAll(/\s/g, ""),
      icon: typeof entry.icon === "string" ? entry.icon.trim() || undefined : undefined,
    };
  });
}

export function resolveTotpIcon(icon: string | undefined, availableFiles: ReadonlySet<string>): string {
  const name = icon?.trim().toLowerCase();
  if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) return "default.png";

  const filename = `${name}.png`;
  return availableFiles.has(filename) ? filename : "default.png";
}

export function createTotpEntries(configs: OtpConfig[]): TotpEntry[] {
  return configs.map((config, index) => {
    const totp = new TOTP({
      issuer: config.website,
      label: config.account,
      secret: Secret.fromBase32(config.secret),
    });

    return {
      ...config,
      id: `${config.website}:${config.account}:${index}`,
      code: totp.generate(),
      uri: totp.toString(),
    };
  });
}

export function getTimeRemaining(now: number): number {
  return 30 - (Math.trunc(now / 1000) % 30);
}
