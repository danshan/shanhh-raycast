import assert from "node:assert/strict";
import test from "node:test";
import { parseDnsServers, parseStoredProfiles, validateProfile } from "../src/utils/network-profile";

test("validates IPv4 manual profiles and contiguous subnet masks", () => {
  assert.equal(
    validateProfile({
      name: "Office",
      ipAddress: "192.0.2.8",
      subnetMask: "255.255.255.0",
      router: "192.0.2.1",
      dnsServers: ["1.1.1.1"],
    }),
    undefined,
  );
  assert.equal(
    validateProfile({
      name: "Office",
      ipAddress: "192.0.2.8",
      subnetMask: "255.0.255.0",
      router: "192.0.2.1",
      dnsServers: ["1.1.1.1"],
    }),
    "Enter a valid contiguous IPv4 subnet mask",
  );
});

test("parses comma and whitespace separated DNS addresses", () => {
  assert.deepEqual(parseDnsServers("1.1.1.1, 8.8.8.8\n9.9.9.9"), ["1.1.1.1", "8.8.8.8", "9.9.9.9"]);
});

test("parses stored profiles and rejects invalid storage data", () => {
  const profiles = [
    {
      id: "profile-1",
      name: "Home",
      ipAddress: "192.0.2.8",
      subnetMask: "255.255.255.0",
      router: "192.0.2.1",
      dnsServers: ["1.1.1.1"],
    },
  ];
  assert.deepEqual(parseStoredProfiles(JSON.stringify(profiles)), profiles);
  assert.throws(() => parseStoredProfiles("{}"), /invalid format/);
});
