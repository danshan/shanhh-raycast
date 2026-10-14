import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NetworkServiceInfo } from "../types";

const execFileAsync = promisify(execFile);
const NETWORKSETUP_PATH = "/usr/sbin/networksetup";

async function run(args: string[]): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync(NETWORKSETUP_PATH, args, {
      timeout: 15_000,
      maxBuffer: 1024 * 1024,
    });
    if (/authorizationcreate\(\) failed/i.test(stderr)) {
      throw new Error("macOS authorization failed");
    }
    return stdout.trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown system error";
    if (/authorization|privilege|permission|not authorized/i.test(message)) {
      throw new Error("macOS could not authorize access to network settings. Apply the change in System Settings or try again.");
    }
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "unknown";
    throw new Error(`networksetup failed (${code})`);
  }
}

export async function listNetworkServices(): Promise<NetworkServiceInfo[]> {
  const [servicesOutput, portsOutput] = await Promise.all([run(["-listallnetworkservices"]), run(["-listnetworkserviceorder"])]);
  const serviceNames = servicesOutput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("An asterisk"))
    .map((line) => line.replace(/^\*\s*/, ""));
  const ports = new Map<string, { hardwarePort: string; device: string }>();
  const blocks = portsOutput.split(/\n\s*\(Hardware Port:/);
  for (const block of blocks.slice(1)) {
    const match = block.match(/^\s*([^,]+), Device: ([^)]+)\)/);
    if (match)
      ports.set(match[1].trim(), {
        hardwarePort: match[1].trim(),
        device: match[2].trim(),
      });
  }
  return serviceNames.map((name) => ({
    name,
    ...(ports.get(name) ?? { hardwarePort: "", device: "" }),
  }));
}

export async function getServiceInfo(service: string): Promise<{ ipv4: string; subnet: string; router: string; dns: string }> {
  const [info, dns] = await Promise.all([run(["-getinfo", service]), run(["-getdnsservers", service])]);
  const field = (label: string) => info.match(new RegExp(`^${label}:\\s*(.*)$`, "mi"))?.[1]?.trim() ?? "Unknown";
  return {
    ipv4: field("IP address"),
    subnet: field("Subnet mask"),
    router: field("Router"),
    dns,
  };
}

export async function setDhcp(service: string): Promise<void> {
  await run(["-setdhcp", service]);
  await run(["-setdnsservers", service, "Empty"]);
}

export async function setManual(
  service: string,
  profile: {
    ipAddress: string;
    subnetMask: string;
    router: string;
    dnsServers: string[];
  },
): Promise<void> {
  await run(["-setmanual", service, profile.ipAddress, profile.subnetMask, profile.router]);
  await run(["-setdnsservers", service, ...profile.dnsServers]);
}
