"use strict";

const assert = require("assert");
const path = require("path");
const core = require(path.join(__dirname, "..", "core.js"));

let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log("ok  " + name);
  } catch (err) {
    failed += 1;
    console.log("FAIL  " + name);
    console.log("  " + (err && err.stack ? err.stack.split("\n")[0] : err));
  }
}

check("clampScore floors, caps, and rounds to one decimal", function () {
  assert.strictEqual(core.clampScore(0), 2.0);
  assert.strictEqual(core.clampScore(99), 9.7);
  assert.strictEqual(core.clampScore(6.26), 6.3);
  assert.strictEqual(core.clampScore("nope"), 2.0);
});

check("intensityBias then clamp stays in roast range", function () {
  assert.strictEqual(core.clampScore(core.intensityBias(9.2, "soft")), 9.7);
  assert.strictEqual(core.clampScore(core.intensityBias(2.1, "savage")), 2.0);
  assert.strictEqual(core.intensityBias(5, "normal"), 5);
});

check("hashBytes is stable and caps at HASH_CAP", function () {
  const a = core.hashBytes(Uint8Array.from([1, 2, 3, 4]), 4);
  const b = core.hashBytes(Uint8Array.from([1, 2, 3, 4]), 4);
  assert.strictEqual(a, b);
  const long = new Uint8Array(90000);
  long[0] = 9;
  const h1 = core.hashBytes(long, 90000);
  const h2 = core.hashBytes(long.subarray(0, core.HASH_CAP), 90000);
  assert.strictEqual(h1, h2);
});

check("measureFrame reports crop geometry, not bone terms", function () {
  const m = core.measureFrame({
    imgW: 1000,
    imgH: 2000,
    luma: 0.42,
    faces: [{ x: 250, y: 400, width: 500, height: 700 }],
  });
  assert.strictEqual(m.faceLock, true);
  assert.strictEqual(m.faceCount, 1);
  assert.strictEqual(m.frameAspect, 0.5);
  assert.ok(m.cropFill > 0.17 && m.cropFill < 0.18);
  assert.ok(Math.abs(m.boxAspect - 500 / 700) < 0.0002);
  assert.strictEqual(m.boxCenterX, 0.5);
  const keys = core.geometryKeys(m).join(" ");
  assert.ok(!/canthal|maxilla|gonial|philtrum|mandible|diagnosis/.test(keys));
});

check("largest face wins when two boxes exist", function () {
  const m = core.measureFrame({
    imgW: 100,
    imgH: 100,
    faces: [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 10, y: 10, width: 40, height: 40 },
    ],
  });
  assert.strictEqual(m.faceCount, 2);
  assert.strictEqual(m.faceLock, false);
  assert.strictEqual(m.cropFill, 0.16);
});

check("honesty is stochastic and refuses medical claims", function () {
  const h = core.honestyFromMeasure(core.measureFrame({ imgW: 640, imgH: 800, faces: [] }));
  assert.strictEqual(h.method, "stochastic");
  assert.strictEqual(h.geometry, "none");
  assert.strictEqual(h.seedSource, "file-prefix-fnv");
  assert.ok(!core.hasMedicalClaim(h.note));
  assert.ok(core.hasMedicalClaim("This is a diagnosis."));
  assert.ok(/not medical/i.test(h.note));
  assert.ok(/satire/i.test(h.note));
  assert.ok(/not bone/i.test(h.note));
  core.formatHonestyLines(h).forEach(function (line) {
    assert.ok(!core.hasMedicalClaim(line));
    assert.ok(!/measuring (canthal|maxilla|gonial)/i.test(line));
  });
});

check("attachHonesty always stamps method=stochastic", function () {
  const audit = core.attachHonesty({ score: 6.1, id: "FA-TEST" }, core.measureFrame({
    imgW: 200,
    imgH: 200,
    faces: [{ x: 40, y: 40, width: 80, height: 100 }],
    luma: 0.5,
  }));
  assert.strictEqual(audit.honesty.method, "stochastic");
  assert.strictEqual(audit.honesty.geometry, "local-bbox");
  const lines = core.formatHonestyLines(audit.honesty);
  assert.ok(lines[0].indexOf("PRNG") !== -1);
  assert.ok(lines.some(function (l) { return /not a diagnosis/i.test(l); }));
});

check("calipers drop selfie bytes and extra keys", function () {
  const dirty = {
    id: "FA-1:6.0:normal",
    hash: "abc",
    score: 6,
    a: "Soft-Jaw Diplomat",
    i: "normal",
    photo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  };
  assert.strictEqual(core.sanitizeCaliperRow(dirty), null);
  const clean = core.sanitizeCaliperRow({
    id: "FA-1:6.0:normal",
    hash: "abc_+/=zzz",
    score: 6.04,
    a: "Soft-Jaw Diplomat",
    i: "normal",
    thumb: "keep-me-not",
  });
  assert.ok(clean);
  assert.strictEqual(clean.score, 6.0);
  assert.strictEqual(clean.hash, "abc_zzz");
  assert.strictEqual(clean.thumb, undefined);
  assert.strictEqual(clean.photo, undefined);
  assert.deepStrictEqual(Object.keys(clean).sort(), ["a", "hash", "i", "id", "score"]);
});

check("caliper list caps at CALIPER_MAX and skips image rows", function () {
  const rows = [];
  for (let i = 0; i < 12; i++) {
    rows.push({ id: "id" + i, hash: "h" + i, score: 5, a: "A", i: "normal" });
  }
  rows[1] = { id: "bad", score: 3, photo: "data:image/jpeg;base64,zzzz" };
  const list = core.sanitizeCaliperList(rows);
  assert.strictEqual(list.length, core.CALIPER_MAX);
  assert.ok(list.every(function (r) { return r.id !== "bad"; }));
});

check("payload roundtrip never carries image bytes", function () {
  const audit = core.attachHonesty({
    score: 4.4,
    id: "FA-DEADBEEF",
    intensity: "savage",
    archetype: { title: "Gonial Soft Serve", tag: "Jaw angle too friendly for the brand." },
    verdict: { title: "Midface midlife crisis" },
    dealbreakers: ["Weak chin", "Jaw width"],
  }, core.measureFrame({ imgW: 10, imgH: 10 }));
  const token = core.encodePayload(audit);
  assert.ok(!core.looksLikeImagePayload(token));
  const back = core.decodePayload(token);
  assert.strictEqual(back.s, 4.4);
  assert.strictEqual(back.id, "FA-DEADBEEF");
  assert.strictEqual(back.g, "none");
  assert.strictEqual(back.photo, undefined);
  assert.ok(!/data:image/i.test(JSON.stringify(back)));
});

check("decodePayload rejects junk and image-shaped JSON", function () {
  assert.strictEqual(core.decodePayload("!!!"), null);
  const sneaky = Buffer.from(JSON.stringify({ s: 3, photo: "data:image/png;base64,xx" }), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  assert.strictEqual(core.decodePayload(sneaky), null);
});

check("sanitizeCaliperRow clamps absurd pin scores into roast range", function () {
  assert.strictEqual(core.sanitizeCaliperRow({ id: "hi", hash: "h", score: 99.5, a: "A", i: "normal" }).score, 9.7);
  assert.strictEqual(core.sanitizeCaliperRow({ id: "lo", hash: "h", score: -10, a: "A", i: "normal" }).score, 2.0);
  assert.strictEqual(core.sanitizeCaliperRow({ id: "mid", hash: "h", score: 6.26, a: "A", i: "normal" }).score, 6.3);
});

check("decodePayload clamps absurd shared scores into roast range", function () {
  function tok(s) {
    return Buffer.from(JSON.stringify({ s: s, a: "X", r: "Y" }), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  assert.strictEqual(core.decodePayload(tok(99.5)).s, 9.7);
  assert.strictEqual(core.decodePayload(tok(-10)).s, 2.0);
  assert.strictEqual(core.decodePayload(tok(6.26)).s, 6.3);
});

check("decodePayload normalizes dealbreakers and stringifies labels", function () {
  function tok(o) {
    return Buffer.from(JSON.stringify(o), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  const asString = core.decodePayload(tok({ s: 5.2, d: "Weak chin", a: 99, r: null }));
  assert.ok(asString);
  assert.deepStrictEqual(asString.d, ["Weak chin"]);
  assert.strictEqual(asString.a, "99");
  assert.strictEqual(asString.r, "");
  const messy = core.decodePayload(tok({ s: 4, d: [1, "", null, "Jaw width", { x: 1 }], t: { n: 1 } }));
  assert.deepStrictEqual(messy.d, ["1", "Jaw width"]);
  assert.strictEqual(messy.t, "");
  const empty = core.decodePayload(tok({ s: 4, d: { nope: true } }));
  assert.deepStrictEqual(empty.d, []);
});


check("loading copy does not pretend to measure bone", function () {
  const blob = core.LOADING_LINES.join(" ").toLowerCase();
  assert.ok(blob.indexOf("stochastic") !== -1);
  assert.ok(!/canthal|maxilla|gonial|golden-ratio council/.test(blob));
  core.LOADING_LINES.forEach(function (line) {
    assert.ok(!core.hasMedicalClaim(line));
    assert.ok(!/\u2014|\u2013/.test(line));
  });
});

check("honesty note and site constants stay ASCII-dash clean", function () {
  assert.ok(!/\u2014|\u2013/.test(core.HONESTY_NOTE));
  assert.strictEqual(core.SITE_HOST, "faceaudit.jonbailey.xyz");
  assert.ok(core.CALIPER_KEY.indexOf(core.SITE_HOST) === 0);
});

check("mulberry32 is deterministic", function () {
  const a = core.mulberry32(123);
  const b = core.mulberry32(123);
  assert.strictEqual(a(), b());
  assert.notStrictEqual(core.mulberry32(1)(), core.mulberry32(2)());
});

check("page copy wires honesty UI and does not claim bone measurement", function () {
  const fs = require("fs");
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.ok(html.indexOf("core.js?v=4.1.0") !== -1);
  assert.ok(html.indexOf("honesty-panel") !== -1);
  assert.ok(html.indexOf("Does it measure my face?") !== -1);
  assert.ok(html.indexOf("id=\"caliper-desk\"") !== -1);
  assert.ok(html.indexOf("aria-describedby=\"cam-hint\"") !== -1);
  assert.ok(!/Measuring bigonial|Computing canthal|Tracing maxilla/.test(html));
  assert.ok(!/Measuring bigonial|Computing canthal|Tracing maxilla/.test(app));
  assert.ok(!/\u2014|\u2013/.test(app));
  assert.ok(app.indexOf("FaceAuditCore") !== -1);
  assert.ok(app.indexOf("unescape(") === -1);
});

if (failed) {
  console.log("\n" + failed + " failed");
  process.exit(1);
}
console.log("\n" + "all honesty tests passed");
