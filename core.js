/**
 * Face Audit core - local crop geometry + stochastic roast math.
 * Scores are PRNG satire. Frame/bbox/luma are photo numbers, not bone.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FaceAuditCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SITE_URL = "https://faceaudit.jonbailey.xyz";
  const SITE_HOST = "faceaudit.jonbailey.xyz";
  const CALIPER_KEY = "faceaudit.jonbailey.xyz:calipers";
  const CALIPER_MAX = 8;
  const HASH_CAP = 65536;
  const HONESTY_NOTE =
    "Not science. Not medical. Roast score is PRNG satire. Local numbers are photo crop geometry, not bone.";

  const LOADING_LINES = [
    "Rolling stochastic calipers...",
    "Hashing the file prefix...",
    "Reading local crop geometry...",
    "Not measuring bone...",
    "Applying intensity bias...",
    "Shuffling the satire deck...",
    "Packaging the roast card...",
    "Still not science...",
  ];

  const IMAGEISH = /^(data:image|blob:)/i;

  function round4(n) {
    if (n == null || !Number.isFinite(Number(n))) return null;
    return Math.round(Number(n) * 10000) / 10000;
  }

  function pct(n) {
    if (n == null || !Number.isFinite(Number(n))) return null;
    return Math.round(Number(n) * 100);
  }

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashBytes(view, size) {
    const src = view || [];
    const n = Math.min(src.length, HASH_CAP);
    let h = 2166136261;
    for (let i = 0; i < n; i++) {
      h ^= src[i];
      h = Math.imul(h, 16777619);
    }
    return (h ^ (size >>> 0)) >>> 0;
  }

  function intensityBias(score, mode) {
    if (mode === "soft") return Math.min(9.8, score + 0.9);
    if (mode === "savage") return Math.max(2.0, score - 0.85);
    return score;
  }

  function clampScore(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 2.0;
    return Math.round(Math.min(9.7, Math.max(2.0, x)) * 10) / 10;
  }

  function roastPercentile(score, rng) {
    const roll = typeof rng === "function" ? rng() : 0.5;
    return Math.max(2, Math.min(97, Math.round(12 + (10 - score) * 8 + roll * 10)));
  }

  function measureFrame(opts) {
    const o = opts || {};
    const imgW = Math.max(0, Number(o.imgW) || 0);
    const imgH = Math.max(0, Number(o.imgH) || 0);
    const faces = Array.isArray(o.faces) ? o.faces : [];
    const lumaRaw = o.luma == null ? null : Number(o.luma);
    const out = {
      imgW: imgW,
      imgH: imgH,
      frameAspect: imgW > 0 && imgH > 0 ? round4(imgW / imgH) : null,
      faceCount: 0,
      faceLock: false,
      cropFill: null,
      boxAspect: null,
      boxCenterX: null,
      boxCenterY: null,
      luma: lumaRaw != null && Number.isFinite(lumaRaw) ? round4(Math.min(1, Math.max(0, lumaRaw))) : null,
    };
    const valid = faces.filter(function (f) {
      return f && Number(f.width) > 0 && Number(f.height) > 0;
    });
    out.faceCount = valid.length;
    out.faceLock = valid.length === 1;
    if (valid.length && imgW > 0 && imgH > 0) {
      const box = valid.reduce(function (a, b) {
        return Number(a.width) * Number(a.height) >= Number(b.width) * Number(b.height) ? a : b;
      });
      const bw = Number(box.width);
      const bh = Number(box.height);
      const bx = Number(box.x) || 0;
      const by = Number(box.y) || 0;
      out.cropFill = round4((bw * bh) / (imgW * imgH));
      out.boxAspect = round4(bw / bh);
      out.boxCenterX = round4((bx + bw / 2) / imgW);
      out.boxCenterY = round4((by + bh / 2) / imgH);
    }
    return out;
  }

  function honestyFromMeasure(measure) {
    const m = measure || {};
    const faceCount = Number(m.faceCount) || 0;
    const cues = {
      frameW: m.imgW || 0,
      frameH: m.imgH || 0,
      frameAspect: m.frameAspect == null ? null : m.frameAspect,
      luma: m.luma == null ? null : m.luma,
    };
    if (faceCount > 0) {
      cues.cropFill = m.cropFill;
      cues.boxAspect = m.boxAspect;
      cues.boxCenterX = m.boxCenterX;
      cues.boxCenterY = m.boxCenterY;
    }
    return {
      method: "stochastic",
      seedSource: "file-prefix-fnv",
      geometry: faceCount > 0 ? "local-bbox" : "none",
      faceLock: faceCount === 1,
      faceCount: faceCount,
      cues: cues,
      note: HONESTY_NOTE,
    };
  }

  function attachHonesty(audit, measure) {
    const measured = measure && typeof measure === "object" ? measure : measureFrame({});
    const next = audit && typeof audit === "object" ? audit : {};
    next.honesty = honestyFromMeasure(measured);
    return next;
  }

  function formatHonestyLines(honesty) {
    const h = honesty || {};
    const c = h.cues || {};
    const lines = [];
    lines.push("Roast score: stochastic (file-hash PRNG + intensity). Satire only.");
    if (c.frameW && c.frameH) {
      let photo = "This photo: " + c.frameW + " x " + c.frameH;
      if (c.frameAspect != null) photo += ", aspect " + Number(c.frameAspect).toFixed(2);
      if (c.luma != null) photo += ", mean luma " + Number(c.luma).toFixed(2);
      lines.push(photo);
    } else {
      lines.push("This photo: local frame size unknown (demo or no pixels read).");
    }
    if (h.faceCount > 0) {
      let box = "Face lock: " + h.faceCount + " box" + (h.faceCount === 1 ? "" : "es");
      if (c.cropFill != null) box += ", " + pct(c.cropFill) + "% of frame";
      if (c.boxAspect != null) box += ", box aspect " + Number(c.boxAspect).toFixed(2);
      if (c.boxCenterX != null && c.boxCenterY != null) {
        box += ", center " + pct(c.boxCenterX) + "% x " + pct(c.boxCenterY) + "%";
      }
      lines.push(box);
    } else {
      lines.push("Face lock: none. Score still satire. Crop box not used.");
    }
    lines.push("Crop numbers are photo geometry, not bone and not a diagnosis.");
    return lines;
  }

  function looksLikeImagePayload(v) {
    if (typeof v !== "string") return false;
    const s = v.trim();
    if (IMAGEISH.test(s)) return true;
    if (s.length > 80 && /base64,/i.test(s.slice(0, 128))) return true;
    return false;
  }

  function sanitizeCaliperRow(row) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    const keys = Object.keys(row);
    for (let i = 0; i < keys.length; i++) {
      if (looksLikeImagePayload(row[keys[i]])) return null;
    }
    // Match decodePayload: Number(null)/Number(true)/Number([]) are finite
    // (0/1/0) and would wrongly pin a caliper at the roast floor.
    const rawScore = row.score;
    let score;
    if (typeof rawScore === "number") {
      score = rawScore;
    } else if (typeof rawScore === "string" && rawScore.trim() !== "") {
      score = Number(rawScore);
    } else {
      return null;
    }
    if (!Number.isFinite(score)) return null;
    const id = String(row.id || "").slice(0, 96);
    if (!id) return null;
    return {
      id: id,
      hash: String(row.hash || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 4096),
      // Hand-edited or corrupt localStorage rows: keep pins in roast range.
      score: clampScore(score),
      a: String(row.a || "").slice(0, 80),
      i: String(row.i || "normal").slice(0, 16),
    };
  }

  function sanitizeCaliperList(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    const seen = {};
    for (let i = 0; i < list.length; i++) {
      const clean = sanitizeCaliperRow(list[i]);
      if (!clean || seen[clean.id]) continue;
      seen[clean.id] = true;
      out.push(clean);
      if (out.length >= CALIPER_MAX) break;
    }
    return out;
  }

  function caliperId(audit) {
    return String((audit && audit.id) || "") + ":" + Number(audit && audit.score).toFixed(1) + ":" + ((audit && audit.intensity) || "");
  }

  function utf8ToB64(str) {
    if (typeof Buffer !== "undefined") return Buffer.from(str, "utf8").toString("base64");
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (_, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    }));
  }

  function b64ToUtf8(b64) {
    if (typeof Buffer !== "undefined") return Buffer.from(b64, "base64").toString("utf8");
    return decodeURIComponent(Array.prototype.map.call(atob(b64), function (ch) {
      return "%" + ch.charCodeAt(0).toString(16).padStart(2, "0");
    }).join(""));
  }

  function toB64Url(str) {
    return utf8ToB64(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function fromB64Url(token) {
    let b64 = String(token || "").replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    return b64ToUtf8(b64);
  }

  function encodePayload(audit) {
    const a = audit || {};
    const payload = {
      v: 1,
      s: a.score,
      a: a.archetype && a.archetype.title,
      t: a.archetype && a.archetype.tag,
      r: a.verdict && a.verdict.title,
      d: a.dealbreakers,
      i: a.intensity,
      id: a.id,
      g: a.honesty ? a.honesty.geometry : "none",
    };
    return toB64Url(JSON.stringify(payload));
  }

  function decodePayload(token) {
    try {
      const p = JSON.parse(fromB64Url(token));
      if (!p || typeof p !== "object") return null;
      // Hand-crafted #r= JSON sometimes stores score as a string ("6.5").
      // Accept only real numbers or numeric strings. Number(null)/Number(true)
      // are finite (0/1) and would wrongly open the challenge at the floor.
      const rawScore = p.s;
      let score;
      if (typeof rawScore === "number") {
        score = rawScore;
      } else if (typeof rawScore === "string" && rawScore.trim() !== "") {
        score = Number(rawScore);
      } else {
        return null;
      }
      if (!Number.isFinite(score)) return null;
      const blob = JSON.stringify(p);
      if (IMAGEISH.test(blob) || /data:image/i.test(blob)) return null;
      // Shared/pinned payloads can be hand-crafted; keep challenge scores in roast range.
      p.s = clampScore(score);
      // Dealbreakers must be a string list. A hand-crafted string/object `d`
      // makes shared-panel forEach throw and the challenge view never opens.
      if (Array.isArray(p.d)) {
        p.d = p.d
          .map(function (x) {
            if (x == null || typeof x === "object") return "";
            return String(x).slice(0, 80);
          })
          .filter(Boolean)
          .slice(0, 12);
      } else if (typeof p.d === "string" && p.d.trim()) {
        p.d = [p.d.trim().slice(0, 80)];
      } else {
        p.d = [];
      }
      p.a = typeof p.a === "string" || typeof p.a === "number" ? String(p.a).slice(0, 80) : "";
      p.t = typeof p.t === "string" || typeof p.t === "number" ? String(p.t).slice(0, 160) : "";
      p.r = typeof p.r === "string" || typeof p.r === "number" ? String(p.r).slice(0, 120) : "";
      return p;
    } catch {
      return null;
    }
  }

  function hasMedicalClaim(text) {
    const s = String(text || "");
    if (/\bclinically proven\b|\bscientifically (?:proven|accurate)\b|\bprescription\b/i.test(s)) return true;
    if (/\bnot (?:medical(?: advice)?|a diagnosis|science)\b/i.test(s)) return false;
    return /\b(?:diagnosis|diagnose|diagnostic|medical advice)\b/i.test(s);
  }

  function geometryKeys(obj, acc) {
    const bag = acc || [];
    if (!obj || typeof obj !== "object") return bag;
    Object.keys(obj).forEach(function (k) {
      bag.push(k.toLowerCase());
      if (obj[k] && typeof obj[k] === "object") geometryKeys(obj[k], bag);
    });
    return bag;
  }

  return {
    SITE_URL: SITE_URL,
    SITE_HOST: SITE_HOST,
    CALIPER_KEY: CALIPER_KEY,
    CALIPER_MAX: CALIPER_MAX,
    HASH_CAP: HASH_CAP,
    HONESTY_NOTE: HONESTY_NOTE,
    LOADING_LINES: LOADING_LINES,
    mulberry32: mulberry32,
    hashBytes: hashBytes,
    intensityBias: intensityBias,
    clampScore: clampScore,
    roastPercentile: roastPercentile,
    measureFrame: measureFrame,
    honestyFromMeasure: honestyFromMeasure,
    attachHonesty: attachHonesty,
    formatHonestyLines: formatHonestyLines,
    sanitizeCaliperRow: sanitizeCaliperRow,
    sanitizeCaliperList: sanitizeCaliperList,
    caliperId: caliperId,
    encodePayload: encodePayload,
    decodePayload: decodePayload,
    hasMedicalClaim: hasMedicalClaim,
    geometryKeys: geometryKeys,
    looksLikeImagePayload: looksLikeImagePayload,
  };
});
