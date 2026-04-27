var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.tsx
var src_exports = {};
__export(src_exports, {
  default: () => Command
});
module.exports = __toCommonJS(src_exports);
var import_react2 = require("react");

// src/components/totp-list.tsx
var import_api = require("@raycast/api");
var import_react = require("react");

// node_modules/otpauth/dist/otpauth.node.mjs
var crypto = __toESM(require("node:crypto"), 1);
var uintDecode = (num) => {
  const buf = new ArrayBuffer(8);
  const arr = new Uint8Array(buf);
  let acc = num;
  for (let i = 7; i >= 0; i--) {
    if (acc === 0)
      break;
    arr[i] = acc & 255;
    acc -= arr[i];
    acc /= 256;
  }
  return arr;
};
var globalScope = (() => {
  if (typeof globalThis === "object")
    return globalThis;
  else {
    Object.defineProperty(Object.prototype, "__GLOBALTHIS__", {
      get() {
        return this;
      },
      configurable: true
    });
    try {
      if (typeof __GLOBALTHIS__ !== "undefined")
        return __GLOBALTHIS__;
    } finally {
      delete Object.prototype.__GLOBALTHIS__;
    }
  }
  if (typeof self !== "undefined")
    return self;
  else if (typeof window !== "undefined")
    return window;
  else if (typeof globalThis !== "undefined")
    return globalThis;
  return void 0;
})();
var canonicalizeAlgorithm = (algorithm) => {
  switch (true) {
    case /^(?:SHA-?1|SSL3-SHA1)$/i.test(algorithm):
      return "SHA1";
    case /^SHA(?:2?-)?224$/i.test(algorithm):
      return "SHA224";
    case /^SHA(?:2?-)?256$/i.test(algorithm):
      return "SHA256";
    case /^SHA(?:2?-)?384$/i.test(algorithm):
      return "SHA384";
    case /^SHA(?:2?-)?512$/i.test(algorithm):
      return "SHA512";
    case /^SHA3-224$/i.test(algorithm):
      return "SHA3-224";
    case /^SHA3-256$/i.test(algorithm):
      return "SHA3-256";
    case /^SHA3-384$/i.test(algorithm):
      return "SHA3-384";
    case /^SHA3-512$/i.test(algorithm):
      return "SHA3-512";
    default:
      throw new TypeError(`Unknown hash algorithm: ${algorithm}`);
  }
};
var hmacDigest = (algorithm, key, message) => {
  if (crypto?.createHmac) {
    const hmac = crypto.createHmac(algorithm, globalScope.Buffer.from(key));
    hmac.update(globalScope.Buffer.from(message));
    return hmac.digest();
  } else {
    throw new Error("Missing HMAC function");
  }
};
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
var base32Decode = (str) => {
  str = str.replace(/ /g, "");
  let end = str.length;
  while (str[end - 1] === "=")
    --end;
  str = (end < str.length ? str.substring(0, end) : str).toUpperCase();
  const buf = new ArrayBuffer(str.length * 5 / 8 | 0);
  const arr = new Uint8Array(buf);
  let bits = 0;
  let value = 0;
  let index = 0;
  for (let i = 0; i < str.length; i++) {
    const idx = ALPHABET.indexOf(str[i]);
    if (idx === -1)
      throw new TypeError(`Invalid character found: ${str[i]}`);
    value = value << 5 | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      arr[index++] = value >>> bits;
    }
  }
  return arr;
};
var base32Encode = (arr) => {
  let bits = 0;
  let value = 0;
  let str = "";
  for (let i = 0; i < arr.length; i++) {
    value = value << 8 | arr[i];
    bits += 8;
    while (bits >= 5) {
      str += ALPHABET[value >>> bits - 5 & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    str += ALPHABET[value << 5 - bits & 31];
  }
  return str;
};
var hexDecode = (str) => {
  str = str.replace(/ /g, "");
  const buf = new ArrayBuffer(str.length / 2);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < str.length; i += 2) {
    arr[i / 2] = parseInt(str.substring(i, i + 2), 16);
  }
  return arr;
};
var hexEncode = (arr) => {
  let str = "";
  for (let i = 0; i < arr.length; i++) {
    const hex = arr[i].toString(16);
    if (hex.length === 1)
      str += "0";
    str += hex;
  }
  return str.toUpperCase();
};
var latin1Decode = (str) => {
  const buf = new ArrayBuffer(str.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i) & 255;
  }
  return arr;
};
var latin1Encode = (arr) => {
  let str = "";
  for (let i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i]);
  }
  return str;
};
var ENCODER = globalScope.TextEncoder ? new globalScope.TextEncoder() : null;
var DECODER = globalScope.TextDecoder ? new globalScope.TextDecoder() : null;
var utf8Decode = (str) => {
  if (!ENCODER) {
    throw new Error("Encoding API not available");
  }
  return ENCODER.encode(str);
};
var utf8Encode = (arr) => {
  if (!DECODER) {
    throw new Error("Encoding API not available");
  }
  return DECODER.decode(arr);
};
var randomBytes2 = (size) => {
  if (crypto?.randomBytes) {
    return crypto.randomBytes(size);
  } else if (globalScope.crypto?.getRandomValues) {
    return globalScope.crypto.getRandomValues(new Uint8Array(size));
  } else {
    throw new Error("Cryptography API not available");
  }
};
var Secret = class _Secret {
  /**
  * Converts a Latin-1 string to a Secret object.
  * @param {string} str Latin-1 string.
  * @returns {Secret} Secret object.
  */
  static fromLatin1(str) {
    return new _Secret({
      buffer: latin1Decode(str).buffer
    });
  }
  /**
  * Converts an UTF-8 string to a Secret object.
  * @param {string} str UTF-8 string.
  * @returns {Secret} Secret object.
  */
  static fromUTF8(str) {
    return new _Secret({
      buffer: utf8Decode(str).buffer
    });
  }
  /**
  * Converts a base32 string to a Secret object.
  * @param {string} str Base32 string.
  * @returns {Secret} Secret object.
  */
  static fromBase32(str) {
    return new _Secret({
      buffer: base32Decode(str).buffer
    });
  }
  /**
  * Converts a hexadecimal string to a Secret object.
  * @param {string} str Hexadecimal string.
  * @returns {Secret} Secret object.
  */
  static fromHex(str) {
    return new _Secret({
      buffer: hexDecode(str).buffer
    });
  }
  /**
  * Secret key buffer.
  * @deprecated For backward compatibility, the "bytes" property should be used instead.
  * @type {ArrayBufferLike}
  */
  get buffer() {
    return this.bytes.buffer;
  }
  /**
  * Latin-1 string representation of secret key.
  * @type {string}
  */
  get latin1() {
    Object.defineProperty(this, "latin1", {
      enumerable: true,
      writable: false,
      configurable: false,
      value: latin1Encode(this.bytes)
    });
    return this.latin1;
  }
  /**
  * UTF-8 string representation of secret key.
  * @type {string}
  */
  get utf8() {
    Object.defineProperty(this, "utf8", {
      enumerable: true,
      writable: false,
      configurable: false,
      value: utf8Encode(this.bytes)
    });
    return this.utf8;
  }
  /**
  * Base32 string representation of secret key.
  * @type {string}
  */
  get base32() {
    Object.defineProperty(this, "base32", {
      enumerable: true,
      writable: false,
      configurable: false,
      value: base32Encode(this.bytes)
    });
    return this.base32;
  }
  /**
  * Hexadecimal string representation of secret key.
  * @type {string}
  */
  get hex() {
    Object.defineProperty(this, "hex", {
      enumerable: true,
      writable: false,
      configurable: false,
      value: hexEncode(this.bytes)
    });
    return this.hex;
  }
  /**
  * Creates a secret key object.
  * @param {Object} [config] Configuration options.
  * @param {ArrayBufferLike} [config.buffer] Secret key buffer.
  * @param {number} [config.size=20] Number of random bytes to generate, ignored if 'buffer' is provided.
  */
  constructor({ buffer, size = 20 } = {}) {
    this.bytes = typeof buffer === "undefined" ? randomBytes2(size) : new Uint8Array(buffer);
    Object.defineProperty(this, "bytes", {
      enumerable: true,
      writable: false,
      configurable: false,
      value: this.bytes
    });
  }
};
var timingSafeEqual2 = (a, b) => {
  if (crypto?.timingSafeEqual) {
    return crypto.timingSafeEqual(globalScope.Buffer.from(a), globalScope.Buffer.from(b));
  } else {
    if (a.length !== b.length) {
      throw new TypeError("Input strings must have the same length");
    }
    let i = -1;
    let out = 0;
    while (++i < a.length) {
      out |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return out === 0;
  }
};
var HOTP = class _HOTP {
  /**
  * Default configuration.
  * @type {{
  *   issuer: string,
  *   label: string,
  *   issuerInLabel: boolean,
  *   algorithm: string,
  *   digits: number,
  *   counter: number
  *   window: number
  * }}
  */
  static get defaults() {
    return {
      issuer: "",
      label: "OTPAuth",
      issuerInLabel: true,
      algorithm: "SHA1",
      digits: 6,
      counter: 0,
      window: 1
    };
  }
  /**
  * Generates an HOTP token.
  * @param {Object} config Configuration options.
  * @param {Secret} config.secret Secret key.
  * @param {string} [config.algorithm='SHA1'] HMAC hashing algorithm.
  * @param {number} [config.digits=6] Token length.
  * @param {number} [config.counter=0] Counter value.
  * @param {(algorithm: string, key: Uint8Array, message: Uint8Array) => Uint8Array} [config.hmac] Custom HMAC function.
  * @returns {string} Token.
  */
  static generate({ secret, algorithm = _HOTP.defaults.algorithm, digits = _HOTP.defaults.digits, counter = _HOTP.defaults.counter, hmac = hmacDigest }) {
    const message = uintDecode(counter);
    const digest = hmac(algorithm, secret.bytes, message);
    if (!digest?.byteLength || digest.byteLength < 19) {
      throw new TypeError("Return value must be at least 19 bytes");
    }
    const offset = digest[digest.byteLength - 1] & 15;
    const otp = ((digest[offset] & 127) << 24 | (digest[offset + 1] & 255) << 16 | (digest[offset + 2] & 255) << 8 | digest[offset + 3] & 255) % 10 ** digits;
    return otp.toString().padStart(digits, "0");
  }
  /**
  * Generates an HOTP token.
  * @param {Object} [config] Configuration options.
  * @param {number} [config.counter=this.counter++] Counter value.
  * @returns {string} Token.
  */
  generate({ counter = this.counter++ } = {}) {
    return _HOTP.generate({
      secret: this.secret,
      algorithm: this.algorithm,
      digits: this.digits,
      counter,
      hmac: this.hmac
    });
  }
  /**
  * Validates an HOTP token.
  * @param {Object} config Configuration options.
  * @param {string} config.token Token value.
  * @param {Secret} config.secret Secret key.
  * @param {string} [config.algorithm='SHA1'] HMAC hashing algorithm.
  * @param {number} [config.digits=6] Token length.
  * @param {number} [config.counter=0] Counter value.
  * @param {number} [config.window=1] Window of counter values to test.
  * @param {(algorithm: string, key: Uint8Array, message: Uint8Array) => Uint8Array} [config.hmac] Custom HMAC function.
  * @returns {number|null} Token delta or null if it is not found in the search window, in which case it should be considered invalid.
  */
  static validate({ token, secret, algorithm, digits = _HOTP.defaults.digits, counter = _HOTP.defaults.counter, window: window2 = _HOTP.defaults.window, hmac = hmacDigest }) {
    if (token.length !== digits)
      return null;
    let delta = null;
    const check = (i) => {
      const generatedToken = _HOTP.generate({
        secret,
        algorithm,
        digits,
        counter: i,
        hmac
      });
      if (timingSafeEqual2(token, generatedToken)) {
        delta = i - counter;
      }
    };
    check(counter);
    for (let i = 1; i <= window2 && delta === null; ++i) {
      check(counter - i);
      if (delta !== null)
        break;
      check(counter + i);
      if (delta !== null)
        break;
    }
    return delta;
  }
  /**
  * Validates an HOTP token.
  * @param {Object} config Configuration options.
  * @param {string} config.token Token value.
  * @param {number} [config.counter=this.counter] Counter value.
  * @param {number} [config.window=1] Window of counter values to test.
  * @returns {number|null} Token delta or null if it is not found in the search window, in which case it should be considered invalid.
  */
  validate({ token, counter = this.counter, window: window2 }) {
    return _HOTP.validate({
      token,
      secret: this.secret,
      algorithm: this.algorithm,
      digits: this.digits,
      counter,
      window: window2,
      hmac: this.hmac
    });
  }
  /**
  * Returns a Google Authenticator key URI.
  * @returns {string} URI.
  */
  toString() {
    const e = encodeURIComponent;
    return `otpauth://hotp/${this.issuer.length > 0 ? this.issuerInLabel ? `${e(this.issuer)}:${e(this.label)}?issuer=${e(this.issuer)}&` : `${e(this.label)}?issuer=${e(this.issuer)}&` : `${e(this.label)}?`}secret=${e(this.secret.base32)}&algorithm=${e(this.algorithm)}&digits=${e(this.digits)}&counter=${e(this.counter)}`;
  }
  /**
  * Creates an HOTP object.
  * @param {Object} [config] Configuration options.
  * @param {string} [config.issuer=''] Account provider.
  * @param {string} [config.label='OTPAuth'] Account label.
  * @param {boolean} [config.issuerInLabel=true] Include issuer prefix in label.
  * @param {Secret|string} [config.secret=Secret] Secret key.
  * @param {string} [config.algorithm='SHA1'] HMAC hashing algorithm.
  * @param {number} [config.digits=6] Token length.
  * @param {number} [config.counter=0] Initial counter value.
  * @param {(algorithm: string, key: Uint8Array, message: Uint8Array) => Uint8Array} [config.hmac] Custom HMAC function.
  */
  constructor({ issuer = _HOTP.defaults.issuer, label = _HOTP.defaults.label, issuerInLabel = _HOTP.defaults.issuerInLabel, secret = new Secret(), algorithm = _HOTP.defaults.algorithm, digits = _HOTP.defaults.digits, counter = _HOTP.defaults.counter, hmac } = {}) {
    this.issuer = issuer;
    this.label = label;
    this.issuerInLabel = issuerInLabel;
    this.secret = typeof secret === "string" ? Secret.fromBase32(secret) : secret;
    this.algorithm = hmac ? algorithm : canonicalizeAlgorithm(algorithm);
    this.digits = digits;
    this.counter = counter;
    this.hmac = hmac;
  }
};
var TOTP = class _TOTP {
  /**
  * Default configuration.
  * @type {{
  *   issuer: string,
  *   label: string,
  *   issuerInLabel: boolean,
  *   algorithm: string,
  *   digits: number,
  *   period: number
  *   window: number
  * }}
  */
  static get defaults() {
    return {
      issuer: "",
      label: "OTPAuth",
      issuerInLabel: true,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      window: 1
    };
  }
  /**
  * Calculates the counter. i.e. the number of periods since timestamp 0.
  * @param {Object} [config] Configuration options.
  * @param {number} [config.period=30] Token time-step duration.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @returns {number} Counter.
  */
  static counter({ period = _TOTP.defaults.period, timestamp = Date.now() } = {}) {
    return Math.floor(timestamp / 1e3 / period);
  }
  /**
  * Calculates the counter. i.e. the number of periods since timestamp 0.
  * @param {Object} [config] Configuration options.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @returns {number} Counter.
  */
  counter({ timestamp = Date.now() } = {}) {
    return _TOTP.counter({
      period: this.period,
      timestamp
    });
  }
  /**
  * Calculates the remaining time in milliseconds until the next token is generated.
  * @param {Object} [config] Configuration options.
  * @param {number} [config.period=30] Token time-step duration.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @returns {number} counter.
  */
  static remaining({ period = _TOTP.defaults.period, timestamp = Date.now() } = {}) {
    return period * 1e3 - timestamp % (period * 1e3);
  }
  /**
  * Calculates the remaining time in milliseconds until the next token is generated.
  * @param {Object} [config] Configuration options.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @returns {number} counter.
  */
  remaining({ timestamp = Date.now() } = {}) {
    return _TOTP.remaining({
      period: this.period,
      timestamp
    });
  }
  /**
  * Generates a TOTP token.
  * @param {Object} config Configuration options.
  * @param {Secret} config.secret Secret key.
  * @param {string} [config.algorithm='SHA1'] HMAC hashing algorithm.
  * @param {number} [config.digits=6] Token length.
  * @param {number} [config.period=30] Token time-step duration.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @param {(algorithm: string, key: Uint8Array, message: Uint8Array) => Uint8Array} [config.hmac] Custom HMAC function.
  * @returns {string} Token.
  */
  static generate({ secret, algorithm, digits, period = _TOTP.defaults.period, timestamp = Date.now(), hmac }) {
    return HOTP.generate({
      secret,
      algorithm,
      digits,
      counter: _TOTP.counter({
        period,
        timestamp
      }),
      hmac
    });
  }
  /**
  * Generates a TOTP token.
  * @param {Object} [config] Configuration options.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @returns {string} Token.
  */
  generate({ timestamp = Date.now() } = {}) {
    return _TOTP.generate({
      secret: this.secret,
      algorithm: this.algorithm,
      digits: this.digits,
      period: this.period,
      timestamp,
      hmac: this.hmac
    });
  }
  /**
  * Validates a TOTP token.
  * @param {Object} config Configuration options.
  * @param {string} config.token Token value.
  * @param {Secret} config.secret Secret key.
  * @param {string} [config.algorithm='SHA1'] HMAC hashing algorithm.
  * @param {number} [config.digits=6] Token length.
  * @param {number} [config.period=30] Token time-step duration.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @param {number} [config.window=1] Window of counter values to test.
  * @param {(algorithm: string, key: Uint8Array, message: Uint8Array) => Uint8Array} [config.hmac] Custom HMAC function.
  * @returns {number|null} Token delta or null if it is not found in the search window, in which case it should be considered invalid.
  */
  static validate({ token, secret, algorithm, digits, period = _TOTP.defaults.period, timestamp = Date.now(), window: window2, hmac }) {
    return HOTP.validate({
      token,
      secret,
      algorithm,
      digits,
      counter: _TOTP.counter({
        period,
        timestamp
      }),
      window: window2,
      hmac
    });
  }
  /**
  * Validates a TOTP token.
  * @param {Object} config Configuration options.
  * @param {string} config.token Token value.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @param {number} [config.window=1] Window of counter values to test.
  * @returns {number|null} Token delta or null if it is not found in the search window, in which case it should be considered invalid.
  */
  validate({ token, timestamp, window: window2 }) {
    return _TOTP.validate({
      token,
      secret: this.secret,
      algorithm: this.algorithm,
      digits: this.digits,
      period: this.period,
      timestamp,
      window: window2,
      hmac: this.hmac
    });
  }
  /**
  * Returns a Google Authenticator key URI.
  * @returns {string} URI.
  */
  toString() {
    const e = encodeURIComponent;
    return `otpauth://totp/${this.issuer.length > 0 ? this.issuerInLabel ? `${e(this.issuer)}:${e(this.label)}?issuer=${e(this.issuer)}&` : `${e(this.label)}?issuer=${e(this.issuer)}&` : `${e(this.label)}?`}secret=${e(this.secret.base32)}&algorithm=${e(this.algorithm)}&digits=${e(this.digits)}&period=${e(this.period)}`;
  }
  /**
  * Creates a TOTP object.
  * @param {Object} [config] Configuration options.
  * @param {string} [config.issuer=''] Account provider.
  * @param {string} [config.label='OTPAuth'] Account label.
  * @param {boolean} [config.issuerInLabel=true] Include issuer prefix in label.
  * @param {Secret|string} [config.secret=Secret] Secret key.
  * @param {string} [config.algorithm='SHA1'] HMAC hashing algorithm.
  * @param {number} [config.digits=6] Token length.
  * @param {number} [config.period=30] Token time-step duration.
  * @param {(algorithm: string, key: Uint8Array, message: Uint8Array) => Uint8Array} [config.hmac] Custom HMAC function.
  */
  constructor({ issuer = _TOTP.defaults.issuer, label = _TOTP.defaults.label, issuerInLabel = _TOTP.defaults.issuerInLabel, secret = new Secret(), algorithm = _TOTP.defaults.algorithm, digits = _TOTP.defaults.digits, period = _TOTP.defaults.period, hmac } = {}) {
    this.issuer = issuer;
    this.label = label;
    this.issuerInLabel = issuerInLabel;
    this.secret = typeof secret === "string" ? Secret.fromBase32(secret) : secret;
    this.algorithm = hmac ? algorithm : canonicalizeAlgorithm(algorithm);
    this.digits = digits;
    this.period = period;
    this.hmac = hmac;
  }
};

// src/components/totp-list.tsx
var fs = __toESM(require("fs"));
var import_jsx_runtime = require("react/jsx-runtime");
var _preps = (0, import_api.getPreferenceValues)();
var getTimeRemaining = function() {
  return 30 - Math.trunc((/* @__PURE__ */ new Date()).valueOf() / 1e3) % 30;
};
function TotpList(props) {
  const gauth = fs.readFileSync(_preps.authFile, "utf8");
  const otpConfigs = JSON.parse(gauth);
  const [searchText, setSearchText] = (0, import_react.useState)(props.searchText);
  const [filteredList, filterList] = (0, import_react.useState)(otpConfigs);
  (0, import_react.useEffect)(() => {
    filterList(
      otpConfigs.filter((item) => item.account.includes(searchText) || item.website.includes(searchText)).map((item) => {
        const totp = new TOTP({
          issuer: item.website || "",
          label: item.account || "",
          secret: Secret.fromBase32(item.secret.replaceAll(/\s*/g, ""))
        });
        console.log(item);
        item.code = totp.generate();
        item.uri = totp.toString();
        return item;
      })
    );
  }, [searchText]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_api.List,
    {
      filtering: false,
      searchBarPlaceholder: "Search TOTP",
      searchText,
      onSearchTextChange: props.onSearchTextChange ?? setSearchText,
      navigationTitle: `Time Remaining: ${getTimeRemaining()}`,
      children: filteredList.map((config) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_api.List.Item,
        {
          icon: "list-icon.png",
          title: config.website || "",
          subtitle: config.account || "",
          accessories: [{ tag: config?.code || "" }],
          actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.ActionPanel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api.ActionPanel.Section, { title: "Copy", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Action.Paste, { title: "Fill the OTP code", content: config?.code }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Action.CopyToClipboard, { title: "Copy the OTP code", content: config?.code }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Action.CopyToClipboard, { title: "Copy the OTP URI", content: config?.uri })
          ] }) })
        },
        config.secret
      ))
    }
  );
}

// src/index.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function Command() {
  const [searchText, setSearchText] = (0, import_react2.useState)("");
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TotpList, { searchText, onSearchTextChange: setSearchText });
}
/*! Bundled license information:

otpauth/dist/otpauth.node.mjs:
  (*! otpauth 9.5.1 | (c) Héctor Molinero Fernández | MIT | https://github.com/hectorm/otpauth *)
*/
