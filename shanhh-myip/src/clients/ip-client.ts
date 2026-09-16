import got from "got";
import { isIP } from "node:net";

export type IpLookupValue = string | number | boolean | null;
export type IpLookupData = Record<string, IpLookupValue>;

export async function getGlobalIp(): Promise<string> {
  return parseIpAddress((await got.get("https://api64.ipify.org")).body);
}

export async function getChineseIp(): Promise<string> {
  return extractIpAddress((await got.get("https://myip.ipip.net")).body);
}

export async function lookupIp(ip: string): Promise<IpLookupData> {
  if (!isIP(ip)) throw new Error("Invalid IP address.");

  const url = new URL("https://ipapi.co");
  url.pathname = `/${ip}/json/`;
  return parseLookupResponse((await got.get(url)).body);
}

export function parseIpAddress(value: string): string {
  const ip = value.trim();
  if (!isIP(ip)) throw new Error("Response did not contain an IP address.");
  return ip;
}

export function extractIpAddress(value: string): string {
  const match = /(?:\d{1,3}\.){3}\d{1,3}/.exec(value);
  if (!match) throw new Error("Response did not contain an IPv4 address.");
  return parseIpAddress(match[0]);
}

export function parseLookupResponse(content: string): IpLookupData {
  const value: unknown = JSON.parse(content);
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("IP lookup returned an invalid response.");
  }

  const record = value as Record<string, unknown>;
  if (record.error === true) throw new Error("IP lookup failed.");

  const result: IpLookupData = {};
  for (const [key, field] of Object.entries(record)) {
    if (field === null || ["string", "number", "boolean"].includes(typeof field)) {
      result[key] = field as IpLookupValue;
    }
  }
  return result;
}
