import assert from "node:assert/strict";
import test from "node:test";
import { createTotpEntries, getTimeRemaining, parseOtpConfigs, resolveTotpIcon } from "../src/utils/totp.ts";

test("parses and normalizes TOTP configuration", () => {
  const configs = parseOtpConfigs(JSON.stringify([{ website: " Example ", account: " user@example.com ", secret: "JBSW Y3DP EHPK 3PXP", icon: " Google " }]));

  assert.deepEqual(configs, [{ website: "Example", account: "user@example.com", secret: "JBSWY3DPEHPK3PXP", icon: "Google" }]);
  assert.match(createTotpEntries(configs)[0].code, /^\d{6}$/);
});

test("rejects invalid TOTP configuration", () => {
  assert.throws(() => parseOtpConfigs("{}"), /must be an array/);
  assert.throws(() => parseOtpConfigs('[{"website":"Example","account":"user@example.com"}]'), /entry 1 is invalid/);
});

test("calculates the remaining TOTP window", () => {
  assert.equal(getTimeRemaining(0), 30);
  assert.equal(getTimeRemaining(29_999), 1);
  assert.equal(getTimeRemaining(30_000), 30);
});

test("uses configured icons only when the bundled asset exists", () => {
  const availableFiles = new Set(["default.png", "google.png"]);

  assert.equal(resolveTotpIcon("google", availableFiles), "google.png");
  assert.equal(resolveTotpIcon("missing", availableFiles), "default.png");
  assert.equal(resolveTotpIcon("../google", availableFiles), "default.png");
  assert.equal(resolveTotpIcon(undefined, availableFiles), "default.png");
});
