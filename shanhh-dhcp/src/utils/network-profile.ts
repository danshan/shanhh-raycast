import { NetworkProfile } from "../types";

const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export function validateProfile(profile: Omit<NetworkProfile, "id">): string | undefined {
  if (!profile.name.trim()) return "Enter a profile name";
  if (!IPV4_PATTERN.test(profile.ipAddress)) return "Enter a valid IPv4 address";
  if (!IPV4_PATTERN.test(profile.subnetMask) || !isContiguousSubnetMask(profile.subnetMask)) {
    return "Enter a valid contiguous IPv4 subnet mask";
  }
  if (!IPV4_PATTERN.test(profile.router)) return "Enter a valid router IPv4 address";
  if (profile.dnsServers.length === 0 || profile.dnsServers.some((server) => !IPV4_PATTERN.test(server))) {
    return "Enter one or more valid DNS IPv4 addresses";
  }
  return undefined;
}

function isContiguousSubnetMask(mask: string): boolean {
  const bits = mask
    .split(".")
    .map(Number)
    .map((octet) => octet.toString(2).padStart(8, "0"))
    .join("");
  return /^1*0*$/.test(bits) && bits.includes("1");
}

export function parseDnsServers(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((server) => server.trim())
    .filter(Boolean);
}

export function parseStoredProfiles(value: string | undefined): NetworkProfile[] {
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || !parsed.every(isNetworkProfile)) {
    throw new Error("Saved network profiles have an invalid format");
  }
  return parsed;
}

function isNetworkProfile(value: unknown): value is NetworkProfile {
  if (typeof value !== "object" || value === null) return false;
  const profile = value as Record<string, unknown>;
  return typeof profile.id === "string" && typeof profile.name === "string" && typeof profile.ipAddress === "string" && typeof profile.subnetMask === "string" && typeof profile.router === "string" && Array.isArray(profile.dnsServers) && profile.dnsServers.every((server) => typeof server === "string");
}
