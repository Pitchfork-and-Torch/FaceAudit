/**
 * Face Audit v4.1 The Calipers - share-first satirical face roast
 * Canonical: https://FaceAudit.grok.me/
 */
(function () {
  "use strict";

  // Live primary (Knock-owned). FaceAudit.grok.me is reserved by Grok Build Mode until xAI verifies.
  const SITE_URL = "https://faceaudit.jonbailey.xyz";
  const SITE_HOST = "faceaudit.jonbailey.xyz";
  const CALIPER_KEY = "faceaudit.jonbailey.xyz:calipers";
  const CALIPER_MAX = 8;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const dropzone = $("#dropzone");
  const fileInput = $("#file-input");
  const dropzoneIdle = $("#dropzone-idle");
  const previewWrap = $("#preview-wrap");
  const previewImg = $("#preview-img");
  const fileNameEl = $("#file-name");
  const clearBtn = $("#clear-btn");
  const auditBtn = $("#audit-btn");
  const faceWarn = $("#face-warn");
  const faceWarnText = $("#face-warn-text");
  const uploadPanel = $("#upload-panel");
  const loadingPanel = $("#loading-panel");
  const resultsPanel = $("#results-panel");
  const sharedPanel = $("#shared-panel");
  const loadingText = $("#loading-text");
  const loadBarFill = $("#load-bar-fill");
  const findingsEl = $("#findings");
  const potentialList = $("#potential-list");
  const scoreValue = $("#score-value");
  const scoreVerdict = $("#score-verdict");
  const scoreBlurb = $("#score-blurb");
  const ringFill = $("#ring-fill");
  const percentileEl = $("#percentile");
  const archetypeTitle = $("#archetype-title");
  const archetypeTag = $("#archetype-tag");
  const dealbreakerChips = $("#dealbreaker-chips");
  const auditIdEl = $("#audit-id");
  const auditIntensityLabel = $("#audit-intensity-label");
  const shareCanvas = $("#share-canvas");
  const cardHint = $("#card-hint");
  const shareStatus = $("#share-status");
  const shareDock = $("#share-dock");
  const cameraModal = $("#camera-modal");
  const cameraVideo = $("#camera-video");
  const cameraSnap = $("#camera-snap");

  let currentFile = null;
  let objectUrl = null;
  let lastAudit = null;
  let intensity = "normal";
  let cardFormat = "story";
  let filterCat = "all";
  let seedBase = 0;
  let cameraStream = null;
  let challengeTarget = null;

  const FORMATS = {
    story: { w: 1080, h: 1920, label: "1080x1920 story" },
    square: { w: 1080, h: 1080, label: "1080x1080 square" },
    og: { w: 1200, h: 630, label: "1200x630 feed" },
  };

  const LOADING_LINES = [
    "Warming up the calipers…",
    "Measuring bigonial width…",
    "Computing canthal tilt…",
    "Tracing maxilla recession vectors…",
    "Consulting the golden-ratio council…",
    "Quantifying eye-area density…",
    "Running gonial-angle forensic pass…",
    "Packaging brutal honesty…",
  ];

  const ARCHETYPES = [
    { title: "Long Midface Menace", tag: "Vertical excess main character. Side profiles fear you." },
    { title: "Soft-Jaw Diplomat", tag: "Chin negotiations ongoing. Mandible still in committee." },
    { title: "Hunter-Eyes Probation", tag: "Canthal tilt filed. Case not closed." },
    { title: "Midface Collapse Theory", tag: "Forward growth left the chat early." },
    { title: "Ogee Curve Myth", tag: "Cheek projection is a rumor with good PR." },
    { title: "Golden Ratio Exile", tag: "Proportions freestyling. The ratio wants a word." },
    { title: "Upper-Third Landlord", tag: "Forehead real estate is corporate." },
    { title: "Gonial Soft Serve", tag: "Jaw angle too friendly for the brand." },
    { title: "Philtrum Highway", tag: "Nose-to-lip commute is a road trip." },
    { title: "Lighting Dependent Legend", tag: "In good light: dangerous. In bad light: paperwork." },
    { title: "Balanced-But-Roastable", tag: "Statistically fine. Aesthetically: we have notes." },
    { title: "Bone Structure Intern", tag: "Potential on the resume. Results pending review." },
  ];

  function L(soft, normal, savage) {
    return { soft, normal, savage };
  }

  const FINDING_POOL = [
    { key: "maxilla", cat: "bones", term: "Recessed maxilla / forward growth", ratings: ["Severe", "Moderate", "Mild", "Borderline"], deal: "Recessed maxilla",
      lines: L(
        ["Midface projection is a little shy. Nothing catastrophic.", "Slight forward-growth FOMO. Soft tissue is covering."],
        ["Your midface is collapsing inward like a poorly planned city.", "Maxilla is playing hide-and-seek. Projection is theoretical."],
        ["Maxilla recessed so hard it filed for remote work.", "Forward growth ghosted you in middle school."]
      ) },
    { key: "mandible", cat: "bones", term: "Recessed mandible / chin projection", ratings: ["Chinlet", "Soft", "Acceptable", "Quiet"], deal: "Weak chin",
      lines: L(
        ["Chin is polite. Projection could speak up more.", "Lower third is present - just not running for office."],
        ["Chin projection is MIA. Mandible filed a missing-persons report.", "Weak chin energy. Side profile got shy in puberty."],
        ["Chin so recessed it is paying rent in the throat.", "Mandible is cosplaying as neck. Absolute chinlet era."]
      ) },
    { key: "midface", cat: "prop", term: "Midface length", ratings: ["Long", "Short", "Balanced", "Elongated"], deal: "Midface length",
      lines: L(
        ["Midface length leans long - vertical space is generous.", "Slightly compact midface. Cozy, not catastrophic."],
        ["Long midface - the runway between eyes and mouth is doing too much.", "Short midface compact mode. The thirds are arguing."],
        ["Midface so long it needs its own zip code.", "Midface compressed like a bad PDF."]
      ) },
    { key: "eye_set", cat: "prop", term: "Eye set (high / low)", ratings: ["High-set", "Low-set", "Neutral", "Slightly high"], deal: "Eye set",
      lines: L(
        ["Eye set is mostly neutral with a hint of height.", "Low-set lean - upper face is thrifting space."],
        ["High-set eyes: forehead real estate is corporate.", "Low-set eyes pull the composition south."],
        ["Eyes so high-set your brow is a second continent.", "Low-set hard. Upper third is empty warehouse vibes."]
      ) },
    { key: "canthal", cat: "soft", term: "Canthal tilt", ratings: ["Negative", "Neutral", "Positive", "Soft-neg"], deal: "Canthal tilt",
      lines: L(
        ["Canthal tilt is near-neutral. Outer corners are chill.", "Slight positive tilt - quiet W."],
        ["Negative canthal tilt - outer corners dropping. Hunter eyes denied.", "Positive canthal tilt detected. Rare W."],
        ["Negative tilt so hard the eyes are sliding off the face.", "Canthal chaos. One eye ascending, one filing a complaint."]
      ) },
    { key: "lids", cat: "soft", term: "Hooded lids / brow ridge", ratings: ["Heavy hood", "Mild hood", "Open lid", "Brow-dom"], deal: "Hooded lids",
      lines: L(
        ["Mild lid hooding. Crease is freelancing.", "Brow ridge present without drama."],
        ["Hooded lids + brow ridge. Upper lids on vacation under bone.", "Brow ridge making a structural statement."],
        ["Lids hooded like a secret society.", "Brow ridge so heavy it has its own weather system."]
      ) },
    { key: "bigonial", cat: "bones", term: "Bigonial width", ratings: ["Narrow", "Wide", "Average", "Taper"], deal: "Jaw width",
      lines: L(
        ["Jaw width is mid-pack.", "Slightly narrow lower face - soft taper."],
        ["Narrow bigonial - lower face tapering into a polite triangle.", "Wide bigonial: jaw claiming horizontal territory."],
        ["Bigonial so narrow the jaw is a raindrop.", "Jaw width eating the midface alive."]
      ) },
    { key: "gonial", cat: "bones", term: "Gonial angle", ratings: ["Obtuse", "Acute", "Ideal-ish", "Soft obtuse"], deal: "Gonial angle",
      lines: L(
        ["Gonial angle is friendly. Soft corner energy.", "Angle is near-ideal on a good day."],
        ["Obtuse gonial angle - jaw corner too friendly.", "Acute gonial: geometric."],
        ["Gonial angle so obtuse it is basically a circle.", "Angle so sharp it is a health hazard."]
      ) },
    { key: "thirds", cat: "prop", term: "Facial thirds imbalance", ratings: ["Upper-heavy", "Lower-heavy", "Mid-dom", "Near-bal"], deal: "Facial thirds",
      lines: L(
        ["Thirds almost balanced. Tiny imbalance.", "Slight upper-third lean."],
        ["Facial thirds are not a democracy.", "Vertical thirds off-balance."],
        ["Thirds so imbalanced it looks like a group project one person carried.", "Golden ratio blocked you."]
      ) },
    { key: "philtrum", cat: "prop", term: "Philtrum length", ratings: ["Long", "Short", "Ideal", "Slightly long"], deal: "Philtrum",
      lines: L(
        ["Philtrum length is fine-ish.", "Slightly long - cupid bow in the suburbs."],
        ["Long philtrum - nose-to-lip commute is a road trip.", "Short philtrum packs the lower midface tight."],
        ["Philtrum so long it needs tolls.", "Philtrum compressed into nonexistence."]
      ) },
    { key: "nose", cat: "soft", term: "Nasal morphology", ratings: ["Bulbous tip", "Wide alar", "Dorsal whisper", "Tip-dom"], deal: "Nose tip / base",
      lines: L(
        ["Nose has character. Tip is a little chatty.", "Alar base a touch wide."],
        ["Bulbous tip energy. Tip hosting a meeting the bridge skipped.", "Wide alar base - nostrils over budget."],
        ["Tip so bulbous it has its own area code.", "Alar base doing stadium seating."]
      ) },
    { key: "cheek", cat: "bones", term: "Cheekbone height / projection", ratings: ["Flat", "High weak", "Projected", "Soft ogee"], deal: "Flat cheeks",
      lines: L(
        ["Cheeks are soft-spoken.", "Height is fine; projection could clock in."],
        ["Cheekbones ghosting hard. Lateral projection is a rumor.", "High set, low projection."],
        ["Cheeks flatter than a group chat apology.", "Zero lateral projection. Front-only DLC."]
      ) },
    { key: "mpa", cat: "bones", term: "Mandibular plane angle", ratings: ["Steep", "Flat", "Moderate", "High-angle"], deal: "Jaw plane",
      lines: L(
        ["MPA moderate. Lower face cooperative.", "Slight steep lean."],
        ["Steep mandibular plane - long-face vibes inbound.", "Flat MPA: compact lower third."],
        ["MPA so steep the jaw is a ski slope.", "Plane flatter than your last apology."]
      ) },
    { key: "harmony", cat: "prop", term: "Harmony / golden-ratio deviation", ratings: ["Δ 12%", "Δ 8%", "Δ 18%", "Δ 5%"], deal: "Harmony off",
      lines: L(
        ["Harmony is mostly holding.", "Near textbook - we still found a note."],
        ["Harmony freestyling off the golden ratio.", "Moderate deviation. Statistically normal."],
        ["Harmony so off the ratio filed a restraining order.", "Features showed up to different meetings."]
      ) },
    { key: "eye_area", cat: "soft", term: "Eye-area density / under-eye", ratings: ["Hollow", "Puffy", "Supported", "Tired"], deal: "Under-eyes",
      lines: L(
        ["Under-eyes a bit tired.", "Orbital support holding with light shadows."],
        ["Under-eye support leasing basement units.", "Orbital density soft."],
        ["Tear troughs deep enough to store secrets.", "Eye area so tired it clocked out in 2019."]
      ) },
    { key: "brow", cat: "soft", term: "Brow position / orbital vector", ratings: ["Low brow", "High arch", "Flat shelf", "Asym"], deal: "Brow position",
      lines: L(
        ["Brow position mostly cooperative.", "Slight asymmetry."],
        ["Brow leasing low square footage.", "High arch without the bone to back it."],
        ["Brows so asymmetric they are in a custody battle.", "Low brow + heavy shelf."]
      ) },
    { key: "lips", cat: "soft", term: "Lip ratio / vermilion", ratings: ["Thin upper", "Lower-dom", "Balanced", "Flat"], deal: "Lip ratio",
      lines: L(
        ["Lips nearly balanced.", "Soft vermilion - quiet, not tragic."],
        ["Upper lip on a minimalism kick.", "Lower-dominant. Upper is a line drawing."],
        ["Upper lip so thin it is a rumor.", "Lips flatlined. Vermilion cancelled."]
      ) },
    { key: "bizygomatic", cat: "prop", term: "Bizygomatic vs lower width", ratings: ["Top-heavy", "Inverted", "Balanced", "Narrow upper"], deal: "Width stack",
      lines: L(
        ["Width cascade is mostly fine.", "Slight top-heavy width."],
        ["Bizygomatic vs jaw: hourglass missing.", "Upper width not sponsoring the lower third."],
        ["Width stack so inverted it is a funnel.", "Top-heavy hard. Lower face afterthought."]
      ) },
  ];

  const VERDICTS = [
    { max: 3.5, title: "Hard reset recommended", blurb: "The scan finished. The scan is not sorry." },
    { max: 5.0, title: "Midface midlife crisis", blurb: "Solidly average with spicy structural footnotes." },
    { max: 6.5, title: "Cope-adjacent / fixable", blurb: "Not cooked, not elite. A few vectors holding the frame hostage." },
    { max: 8.0, title: "Upper-mid / lighting dependent", blurb: "Decent raw material. Angle and haircut doing unpaid labor." },
    { max: 10.0, title: "Annoyingly competent bones", blurb: "The algorithm is mad it cannot roast harder." },
  ];

  const POTENTIAL_POOL = [
    "Sleep 8 hours. Undereye support loves boring habits.",
    "Haircut maxxing is free surgery for mid faces.",
    "Posture check. Stop shrimp-posting in real life.",
    "Skincare before bone jokes.",
    "Gym the neck and traps. Frame cosplays as harmony.",
    "If you consider procedures, talk to real clinicians.",
    "Softmaxx: brows, lashes, grooming.",
    "Lighting is ~40% of perceived score.",
    "Delete the 10x zoom mirror app.",
    "Chew sugar-free gum like it owes you money.",
    "Mew if you want - jaw soreness and unearned confidence included.",
    "Side-profile photos only after acceptance.",
  ];

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  async function hashSeed(file) {
    const buf = await file.arrayBuffer();
    const slice = buf.byteLength > 65536 ? buf.slice(0, 65536) : buf;
    let h = 2166136261;
    const view = new Uint8Array(slice);
    for (let i = 0; i < view.length; i++) {
      h ^= view[i];
      h = Math.imul(h, 16777619);
    }
    return (h ^ file.size) >>> 0;
  }

  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  function shuffle(rng, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function publicBase() {
    try {
      if (location.protocol.startsWith("http") && location.hostname && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
        return location.origin;
      }
    } catch { /* ignore */ }
    return SITE_URL;
  }

  function intensityBias(score, mode) {
    if (mode === "soft") return Math.min(9.8, score + 0.9);
    if (mode === "savage") return Math.max(2.0, score - 0.85);
    return score;
  }

  function buildAudit(rng, mode) {
    const count = 12 + Math.floor(rng() * 5);
    const selected = shuffle(rng, FINDING_POOL).slice(0, count);
    const findings = selected.map((item, i) => ({
      n: i + 1,
      key: item.key,
      cat: item.cat,
      term: item.term,
      rating: pick(rng, item.ratings),
      body: pick(rng, item.lines[mode] || item.lines.normal),
      deal: item.deal,
    }));
    let base = intensityBias(3.2 + rng() * 5.2, mode);
    const score = Math.round(Math.min(9.7, Math.max(2.0, base)) * 10) / 10;
    const verdict = VERDICTS.find((v) => score <= v.max) || VERDICTS[VERDICTS.length - 1];
    return {
      score,
      verdict,
      findings,
      potential: shuffle(rng, POTENTIAL_POOL).slice(0, 5 + Math.floor(rng() * 2)),
      archetype: pick(rng, ARCHETYPES),
      dealbreakers: findings.slice(0, 3).map((f) => f.deal),
      percentile: Math.max(2, Math.min(97, Math.round(12 + (10 - score) * 8 + rng() * 10))),
      id: "FA-" + (rng() * 0xffffffff >>> 0).toString(16).toUpperCase().padStart(8, "0"),
      intensity: mode,
    };
  }

  function setPreview(file) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    currentFile = file;
    objectUrl = URL.createObjectURL(file);
    previewImg.src = objectUrl;
    fileNameEl.textContent = file.name || "capture.jpg";
    dropzoneIdle.classList.add("hidden");
    previewWrap.classList.remove("hidden");
    dropzone.classList.add("has-image");
    auditBtn.disabled = false;
    faceWarn.classList.add("hidden");
    runFaceHint(previewImg);
  }

  function clearPreview() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    currentFile = null;
    previewImg.removeAttribute("src");
    fileNameEl.textContent = "—";
    dropzoneIdle.classList.remove("hidden");
    previewWrap.classList.add("hidden");
    dropzone.classList.remove("has-image");
    auditBtn.disabled = true;
    faceWarn.classList.add("hidden");
    fileInput.value = "";
  }

  async function runFaceHint(img) {
    try {
      if (typeof FaceDetector === "undefined") return;
      await new Promise((res, rej) => {
        if (img.complete && img.naturalWidth) res();
        else { img.onload = () => res(); img.onerror = rej; }
      });
      const faces = await new FaceDetector({ fastMode: true, maxDetectedFaces: 2 }).detect(img);
      if (!faces.length) {
        faceWarnText.textContent = "No clear face lock. Audit still runs (satire) - may get weirder.";
        faceWarn.classList.remove("hidden");
      } else if (faces.length > 1) {
        faceWarnText.textContent = "Multiple faces. Primary subject gets roasted; rest are NPCs.";
        faceWarn.classList.remove("hidden");
      } else {
        faceWarnText.textContent = "Face lock acquired. Preparing unsolicited bone takes…";
        faceWarn.classList.remove("hidden");
      }
    } catch { /* optional */ }
  }

  function acceptFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name || "")) {
      faceWarnText.textContent = "Need JPG, PNG, or WebP.";
      faceWarn.classList.remove("hidden");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      faceWarnText.textContent = "File too large. Compress first.";
      faceWarn.classList.remove("hidden");
      return;
    }
    setPreview(file);
  }

  function makeDemoFace() {
    const c = document.createElement("canvas");
    c.width = 640; c.height = 800;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 640, 800);
    g.addColorStop(0, "#1a2030"); g.addColorStop(1, "#0d1018");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 640, 800);
    ctx.fillStyle = "#c4a88a";
    ctx.beginPath(); ctx.ellipse(320, 400, 160, 210, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2a2a32";
    ctx.beginPath(); ctx.ellipse(260, 360, 22, 14, -0.1, 0, Math.PI * 2); ctx.ellipse(380, 360, 22, 14, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#5a4030"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(320, 370); ctx.lineTo(310, 430); ctx.lineTo(330, 430); ctx.stroke();
    ctx.beginPath(); ctx.arc(320, 480, 40, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.fillStyle = "rgba(0,255,200,0.2)"; ctx.font = "600 22px sans-serif";
    ctx.fillText("DEMO SUBJECT", 230, 100);
    c.toBlob((blob) => blob && acceptFile(new File([blob], "demo-face.png", { type: "image/png" })), "image/png");
  }

  async function openCamera() {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      cameraVideo.srcObject = cameraStream;
      cameraModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    } catch {
      faceWarnText.textContent = "Camera blocked. Upload a photo instead.";
      faceWarn.classList.remove("hidden");
    }
  }

  function closeCamera() {
    if (cameraStream) { cameraStream.getTracks().forEach((t) => t.stop()); cameraStream = null; }
    cameraVideo.srcObject = null;
    cameraModal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function snapCamera() {
    const v = cameraVideo;
    const w = v.videoWidth || 640, h = v.videoHeight || 480;
    cameraSnap.width = w; cameraSnap.height = h;
    const ctx = cameraSnap.getContext("2d");
    ctx.translate(w, 0); ctx.scale(-1, 1); ctx.drawImage(v, 0, 0, w, h);
    cameraSnap.toBlob((blob) => {
      if (!blob) return;
      closeCamera();
      acceptFile(new File([blob], "camera-capture.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }

  function setIntensity(mode) {
    intensity = mode;
    $$("#intensity-seg .seg-btn").forEach((btn) => {
      const on = btn.dataset.intensity === mode;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function setFilter(cat) {
    filterCat = cat;
    $$("#filter-seg .seg-btn").forEach((btn) => {
      const on = btn.dataset.filter === cat;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    $$(".finding", findingsEl).forEach((el) => {
      el.classList.toggle("hidden-filter", !(cat === "all" || el.dataset.cat === cat));
    });
  }

  function setFormat(fmt) {
    cardFormat = fmt;
    $$("#format-seg .seg-btn").forEach((btn) => {
      const on = btn.dataset.format === fmt;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    shareCanvas.classList.remove("format-square", "format-og");
    if (fmt === "square") shareCanvas.classList.add("format-square");
    if (fmt === "og") shareCanvas.classList.add("format-og");
    const f = FORMATS[fmt];
    shareCanvas.width = f.w;
    shareCanvas.height = f.h;
    cardHint.textContent = `${f.label} · watermarked ${SITE_HOST}`;
    if (lastAudit) drawShareCard(lastAudit);
  }

  function showLoading() {
    uploadPanel.classList.add("hidden");
    resultsPanel.classList.add("hidden");
    sharedPanel.classList.add("hidden");
    shareDock.classList.add("hidden");
    loadingPanel.classList.remove("hidden");
    loadBarFill.style.width = "8%";
    let i = 0, progress = 8;
    loadingText.textContent = LOADING_LINES[0];
    return setInterval(() => {
      i = (i + 1) % LOADING_LINES.length;
      loadingText.textContent = LOADING_LINES[i];
      progress = Math.min(92, progress + 7 + Math.random() * 8);
      loadBarFill.style.width = progress + "%";
    }, 420);
  }

  function renderResults(audit) {
    lastAudit = audit;
    findingsEl.innerHTML = "";
    potentialList.innerHTML = "";
    dealbreakerChips.innerHTML = "";

    scoreValue.textContent = audit.score.toFixed(1);
    scoreVerdict.textContent = audit.verdict.title;
    scoreBlurb.textContent = audit.verdict.blurb;
    archetypeTitle.textContent = audit.archetype.title;
    archetypeTag.textContent = audit.archetype.tag;
    auditIdEl.textContent = audit.id;
    auditIntensityLabel.textContent = audit.intensity.charAt(0).toUpperCase() + audit.intensity.slice(1);
    percentileEl.textContent = `Roast percentile: harsher than ~${audit.percentile}% of mock audits`;

    if (challengeTarget && typeof challengeTarget.s === "number") {
      const beat = audit.score > challengeTarget.s;
      percentileEl.textContent += beat
        ? ` · You beat their ${Number(challengeTarget.s).toFixed(1)}`
        : ` · Their score: ${Number(challengeTarget.s).toFixed(1)} (not beaten yet)`;
    }

    audit.dealbreakers.forEach((d, i) => {
      const chip = document.createElement("span");
      chip.className = "chip" + (i === 0 ? "" : i === 1 ? " amber" : " neon");
      chip.textContent = d;
      dealbreakerChips.appendChild(chip);
    });

    const C = 2 * Math.PI * 52;
    ringFill.style.strokeDasharray = String(C);
    ringFill.style.strokeDashoffset = String(C);
    ringFill.style.stroke = audit.score < 4 ? "#ff4d6a" : audit.score < 6.5 ? "#ffb020" : "#00ffc8";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ringFill.style.strokeDashoffset = String(C * (1 - audit.score / 10));
    }));

    audit.findings.forEach((f, idx) => {
      const el = document.createElement("article");
      el.className = "finding";
      el.dataset.cat = f.cat;
      el.style.animationDelay = `${idx * 0.04}s`;
      el.innerHTML = `<div class="finding-top"><span class="finding-term">${f.n}. ${escapeHtml(f.term)}</span><span class="finding-rating">${escapeHtml(f.rating)}</span></div><p class="finding-body">${escapeHtml(f.body)}</p><span class="finding-cat">${escapeHtml(f.cat)}</span>`;
      findingsEl.appendChild(el);
    });
    setFilter(filterCat);
    audit.potential.forEach((tip) => {
      const li = document.createElement("li");
      li.textContent = tip;
      potentialList.appendChild(li);
    });

    loadingPanel.classList.add("hidden");
    loadBarFill.style.width = "100%";
    resultsPanel.classList.remove("hidden");
    shareDock.classList.remove("hidden");
    shareStatus.textContent = "";
    setFormat(cardFormat);
    syncPinBtn();
    resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "", yy = y;
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + " ";
      if (ctx.measureText(test).width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, yy);
        line = words[n] + " ";
        yy += lineHeight;
      } else line = test;
    }
    ctx.fillText(line.trim(), x, yy);
    return yy;
  }

  function drawShareCard(audit) {
    const canvas = shareCanvas;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const isOg = cardFormat === "og";
    const isSquare = cardFormat === "square";
    const pad = isOg ? 48 : 56;
    const scale = isOg ? 0.72 : isSquare ? 0.9 : 1;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0a0c14");
    bg.addColorStop(0.55, "#07080e");
    bg.addColorStop(1, "#0c0610");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(0,255,200,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const o1 = ctx.createRadialGradient(W * 0.2, H * 0.15, 20, W * 0.2, H * 0.15, W * 0.4);
    o1.addColorStop(0, "rgba(0,255,200,0.14)"); o1.addColorStop(1, "transparent");
    ctx.fillStyle = o1; ctx.fillRect(0, 0, W, H);
    const o2 = ctx.createRadialGradient(W * 0.85, H * 0.85, 20, W * 0.85, H * 0.85, W * 0.4);
    o2.addColorStop(0, "rgba(255,45,149,0.14)"); o2.addColorStop(1, "transparent");
    ctx.fillStyle = o2; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(0,255,200,0.3)";
    ctx.lineWidth = 3;
    roundRect(ctx, pad * 0.7, pad * 0.7, W - pad * 1.4, H - pad * 1.4, 28);
    ctx.stroke();

    let y = pad + 20;
    ctx.fillStyle = "rgba(0,255,200,0.75)";
    ctx.font = `600 ${Math.round(26 * scale)}px ui-monospace, Consolas, monospace`;
    ctx.fillText("FACE AUDIT", pad, y);
    y += Math.round(36 * scale);
    ctx.fillStyle = "rgba(255,45,149,0.9)";
    ctx.font = `500 ${Math.round(20 * scale)}px ui-monospace, monospace`;
    ctx.fillText(audit.id, pad, y);

    y += Math.round(isOg ? 70 : 100);
    let scoreColor = audit.score < 4 ? "#ff4d6a" : audit.score < 6.5 ? "#ffb020" : "#00ffc8";
    ctx.fillStyle = scoreColor;
    ctx.font = `800 ${Math.round((isOg ? 100 : 150) * scale)}px Clash Display, sans-serif`;
    ctx.fillText(audit.score.toFixed(1), pad, y);
    const scoreW = ctx.measureText(audit.score.toFixed(1)).width;
    ctx.fillStyle = "rgba(232,240,238,0.45)";
    ctx.font = `600 ${Math.round(36 * scale)}px Clash Display, sans-serif`;
    ctx.fillText("/ 10", pad + scoreW + 12, y - Math.round(20 * scale));

    y += Math.round(isOg ? 40 : 70);
    ctx.fillStyle = "#ff2d95";
    ctx.font = `600 ${Math.round(20 * scale)}px ui-monospace, monospace`;
    ctx.fillText("ARCHETYPE", pad, y);
    y += Math.round(40 * scale);
    ctx.fillStyle = "#e8f0ee";
    ctx.font = `700 ${Math.round((isOg ? 34 : 46) * scale)}px Clash Display, sans-serif`;
    y = wrapText(ctx, audit.archetype.title, pad, y, W - pad * 2, Math.round(48 * scale)) + Math.round(36 * scale);

    ctx.fillStyle = "rgba(0,255,200,0.75)";
    ctx.font = `600 ${Math.round(20 * scale)}px ui-monospace, monospace`;
    ctx.fillText("VERDICT", pad, y);
    y += Math.round(36 * scale);
    ctx.fillStyle = "#e8f0ee";
    ctx.font = `650 ${Math.round((isOg ? 28 : 34) * scale)}px Clash Display, sans-serif`;
    y = wrapText(ctx, audit.verdict.title, pad, y, W - pad * 2, Math.round(40 * scale)) + Math.round(40 * scale);

    if (!isOg) {
      ctx.fillStyle = "rgba(255,176,32,0.9)";
      ctx.font = `600 ${Math.round(20 * scale)}px ui-monospace, monospace`;
      ctx.fillText("TOP DEALBREAKERS", pad, y);
      y += Math.round(50 * scale);
      audit.dealbreakers.forEach((d, i) => {
        ctx.fillStyle = "rgba(255,255,255,0.07)";
        roundRect(ctx, pad, y - 32, W - pad * 2, Math.round(56 * scale), 14);
        ctx.fill();
        ctx.fillStyle = "#ffb0bc";
        ctx.font = `600 ${Math.round(28 * scale)}px Clash Display, sans-serif`;
        ctx.fillText(`${i + 1}.  ${d}`, pad + 20, y + 4);
        y += Math.round(72 * scale);
      });
    } else {
      ctx.fillStyle = "#ffb0bc";
      ctx.font = `600 ${Math.round(22 * scale)}px Clash Display, sans-serif`;
      ctx.fillText(audit.dealbreakers.join("  ·  "), pad, y);
    }

    // watermark
    ctx.fillStyle = "rgba(0,255,200,0.7)";
    ctx.font = `600 ${Math.round(22 * scale)}px ui-monospace, monospace`;
    ctx.fillText(SITE_HOST, pad, H - pad);
    ctx.fillStyle = "rgba(122,138,134,0.95)";
    ctx.font = `500 ${Math.round(18 * scale)}px ui-monospace, monospace`;
    ctx.fillText(`satire · not science · ${audit.intensity}`, pad, H - pad + Math.round(28 * scale));
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  function buildShareText(audit, mode = "full") {
    if (mode === "short") {
      return `Face Audit: ${audit.score.toFixed(1)}/10\n${audit.archetype.title}\nDealbreakers: ${audit.dealbreakers.join(" · ")}\nCan you beat my score?\n${publicBase()}/`;
    }
    if (mode === "challenge") {
      return [
        "I just got Face Audited.",
        `Score: ${audit.score.toFixed(1)}/10 - ${audit.archetype.title}`,
        `Top dealbreakers: ${audit.dealbreakers.join(", ")}`,
        "",
        "Your turn. Beat my score:",
        encodeResultLink(audit),
        "",
        "Satire only. Stochastic calipers, not science.",
      ].join("\n");
    }
    return [
      "FACE AUDIT",
      `Score: ${audit.score.toFixed(1)} / 10`,
      `Archetype: ${audit.archetype.title}`,
      `Verdict: ${audit.verdict.title}`,
      `ID: ${audit.id}`,
      "",
      "Top dealbreakers:",
      ...audit.dealbreakers.map((d) => `• ${d}`),
      "",
      ...audit.findings.slice(0, 6).map((f) => `• ${f.term} [${f.rating}]`),
      "",
      `Play: ${publicBase()}/`,
      "Satire only. Not medical advice.",
    ].join("\n");
  }

  function encodeResultLink(audit) {
    const payload = {
      v: 1,
      s: audit.score,
      a: audit.archetype.title,
      t: audit.archetype.tag,
      r: audit.verdict.title,
      d: audit.dealbreakers,
      i: audit.intensity,
      id: audit.id,
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return `${publicBase()}/#r=${b64}`;
  }

  function readCalipers() {
    try {
      const raw = localStorage.getItem(CALIPER_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(0, CALIPER_MAX) : [];
    } catch {
      return [];
    }
  }

  function writeCalipers(list) {
    try {
      localStorage.setItem(CALIPER_KEY, JSON.stringify(list.slice(0, CALIPER_MAX)));
    } catch { /* ignore */ }
  }

  function caliperId(audit) {
    return String(audit.id || "") + ":" + Number(audit.score).toFixed(1) + ":" + (audit.intensity || "");
  }

  function isPinned(audit) {
    if (!audit) return false;
    const id = caliperId(audit);
    return readCalipers().some((x) => x.id === id);
  }

  function upsertCaliper(audit) {
    const id = caliperId(audit);
    const hash = (encodeResultLink(audit).split("#r=")[1] || "");
    const row = {
      id: id,
      hash: hash,
      score: audit.score,
      a: audit.archetype.title,
      i: audit.intensity,
    };
    writeCalipers([row].concat(readCalipers().filter((x) => x.id !== id)));
    renderCalipers();
    syncPinBtn();
  }

  function dropCaliper(id) {
    writeCalipers(readCalipers().filter((x) => x.id !== id));
    renderCalipers();
    syncPinBtn();
  }

  function renderCalipers() {
    const el = $("#caliper-pins");
    if (!el) return;
    const pins = readCalipers();
    if (!pins.length) {
      el.innerHTML = '<p class="caliper-empty">The Calipers are empty. After an audit, pin the card.</p>';
      return;
    }
    el.innerHTML = pins
      .map((p) => {
        const label = String(p.a || "Roast").slice(0, 42);
        return (
          '<div class="caliper-pin">' +
          '<span class="score">' + Number(p.score).toFixed(1) + "</span>" +
          '<button type="button" class="label" data-open="' + escapeHtml(p.hash || "") + '">' +
          escapeHtml(label) +
          "</button>" +
          '<button type="button" class="drop" data-drop="' + escapeHtml(p.id) + '" aria-label="Remove pin">x</button>' +
          "</div>"
        );
      })
      .join("");
    el.querySelectorAll("[data-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const h = btn.getAttribute("data-open");
        if (!h) return;
        location.hash = "r=" + h;
        tryLoadSharedFromHash();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    el.querySelectorAll("[data-drop]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropCaliper(btn.getAttribute("data-drop"));
      });
    });
  }

  function syncPinBtn() {
    const btn = $("#pin-calipers-btn");
    if (!btn) return;
    const on = isPinned(lastAudit);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.textContent = on ? "On The Calipers" : "Pin to The Calipers";
  }

  function tryLoadSharedFromHash() {
    const m = (location.hash || "").match(/^#r=([A-Za-z0-9_-]+)/);
    if (!m) return false;
    try {
      let b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const p = JSON.parse(decodeURIComponent(escape(atob(b64))));
      if (!p || typeof p.s !== "number") return false;
      challengeTarget = p;
      uploadPanel.classList.add("hidden");
      resultsPanel.classList.add("hidden");
      loadingPanel.classList.add("hidden");
      sharedPanel.classList.remove("hidden");
      $("#shared-score").textContent = Number(p.s).toFixed(1);
      $("#shared-verdict").textContent = p.r || "Shared verdict";
      $("#shared-arch-title").textContent = p.a || "Unknown archetype";
      $("#shared-arch-tag").textContent = p.t || "";
      $("#beat-line").textContent = `Their score: ${Number(p.s).toFixed(1)} / 10 - can you beat it?`;
      const chips = $("#shared-chips");
      chips.innerHTML = "";
      (p.d || []).forEach((d, i) => {
        const c = document.createElement("span");
        c.className = "chip" + (i === 0 ? "" : i === 1 ? " amber" : " neon");
        c.textContent = d;
        chips.appendChild(c);
      });
      return true;
    } catch { return false; }
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.cssText = "position:fixed;left:-9999px";
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
  }

  const setStatus = (msg) => { shareStatus.textContent = msg; };

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function shareNative() {
    if (!lastAudit) return;
    const text = buildShareText(lastAudit, "short");
    const blob = await canvasToBlob(shareCanvas);
    const file = blob ? new File([blob], `face-audit-${lastAudit.score.toFixed(1)}.png`, { type: "image/png" }) : null;
    try {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Face Audit", text, files: [file] });
        setStatus("Shared card via system sheet.");
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "Face Audit", text: buildShareText(lastAudit, "challenge") });
        setStatus("Shared challenge text.");
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") { setStatus("Share cancelled."); return; }
    }
    if (blob) downloadBlob(blob, `face-audit-${lastAudit.score.toFixed(1)}.png`);
    await copyText(text);
    setStatus("PNG downloaded + text copied.");
  }

  async function downloadCard() {
    if (!lastAudit) return;
    const blob = await canvasToBlob(shareCanvas);
    if (!blob) { setStatus("Export failed."); return; }
    downloadBlob(blob, `face-audit-${cardFormat}-${lastAudit.id}.png`);
    setStatus(`${FORMATS[cardFormat].label} downloaded.`);
  }

  async function copyLink() {
    if (!lastAudit) return;
    setStatus((await copyText(encodeResultLink(lastAudit))) ? "Result link copied." : "Copy failed.");
  }

  async function copyRoast() {
    if (!lastAudit) return;
    setStatus((await copyText(buildShareText(lastAudit, "full"))) ? "Full roast copied." : "Copy failed.");
  }

  async function copyShort() {
    if (!lastAudit) return;
    setStatus((await copyText(buildShareText(lastAudit, "short"))) ? "Score flex copied." : "Copy failed.");
  }

  async function challengeFriend() {
    if (!lastAudit) return;
    setStatus((await copyText(buildShareText(lastAudit, "challenge"))) ? "Challenge paste ready for the group chat." : "Copy failed.");
  }

  function tweetIntent() {
    if (!lastAudit) return;
    const text = buildShareText(lastAudit, "short");
    window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer");
    downloadCard();
    setStatus("X compose opened. Attach the PNG.");
  }

  async function runAudit(extraSeed = 0) {
    if (!currentFile) return;
    auditBtn.disabled = true;
    const interval = showLoading();
    const t0 = Date.now();
    try {
      if (!seedBase) seedBase = await hashSeed(currentFile);
      const seed = (seedBase ^ (extraSeed * 0x9e3779b9) ^ (intensity === "savage" ? 0x5a7a6e : intensity === "soft" ? 0x50f7 : 0xfacea11)) >>> 0;
      const audit = buildAudit(mulberry32(seed), intensity);
      await new Promise((r) => setTimeout(r, Math.max(0, 2400 - (Date.now() - t0))));
      clearInterval(interval);
      loadBarFill.style.width = "100%";
      renderResults(audit);
    } catch (err) {
      clearInterval(interval);
      loadingPanel.classList.add("hidden");
      uploadPanel.classList.remove("hidden");
      faceWarnText.textContent = "Audit crashed. Try another image.";
      faceWarn.classList.remove("hidden");
      auditBtn.disabled = false;
      console.error(err);
    }
  }

  function goCaptureFromChallenge(openCam) {
    sharedPanel.classList.add("hidden");
    uploadPanel.classList.remove("hidden");
    history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (openCam) openCamera();
  }

  // events
  dropzone.addEventListener("click", (e) => {
    if (e.target.closest("#clear-btn")) return;
    if (dropzone.classList.contains("has-image") && e.target.closest(".preview-meta")) return;
    fileInput.click();
  });
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener("change", () => acceptFile(fileInput.files && fileInput.files[0]));
  ["dragenter", "dragover"].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("dragover"); }));
  ["dragleave", "drop"].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("dragover"); }));
  dropzone.addEventListener("drop", (e) => acceptFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]));
  clearBtn.addEventListener("click", (e) => { e.stopPropagation(); clearPreview(); });

  $("#intensity-seg").addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (btn) setIntensity(btn.dataset.intensity);
  });
  $("#filter-seg").addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (btn) setFilter(btn.dataset.filter);
  });
  $("#format-seg").addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (btn) setFormat(btn.dataset.format);
  });

  auditBtn.addEventListener("click", () => runAudit(0));
  $("#reroll-btn").addEventListener("click", () => currentFile && runAudit((Math.random() * 1e9) | 0));
  $("#reaudit-btn").addEventListener("click", () => {
    resultsPanel.classList.add("hidden");
    shareDock.classList.add("hidden");
    uploadPanel.classList.remove("hidden");
    clearPreview();
    lastAudit = null;
    seedBase = 0;
    challengeTarget = null;
    history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  $("#share-native-btn").addEventListener("click", shareNative);
  $("#download-card-btn").addEventListener("click", downloadCard);
  $("#copy-link-btn").addEventListener("click", copyLink);
  $("#copy-text-btn").addEventListener("click", copyRoast);
  $("#copy-short-btn").addEventListener("click", copyShort);
  $("#tweet-btn").addEventListener("click", tweetIntent);
  $("#challenge-btn").addEventListener("click", challengeFriend);
  const pinBtn = $("#pin-calipers-btn");
  if (pinBtn) {
    pinBtn.addEventListener("click", () => {
      if (!lastAudit) return;
      if (isPinned(lastAudit)) dropCaliper(caliperId(lastAudit));
      else upsertCaliper(lastAudit);
    });
  }
  $("#dock-share-btn").addEventListener("click", shareNative);
  $("#dock-download-btn").addEventListener("click", downloadCard);
  $("#dock-challenge-btn").addEventListener("click", challengeFriend);

  $("#camera-btn").addEventListener("click", openCamera);
  $("#camera-close").addEventListener("click", closeCamera);
  $("#camera-backdrop").addEventListener("click", closeCamera);
  $("#camera-snap-btn").addEventListener("click", snapCamera);
  $("#demo-btn").addEventListener("click", makeDemoFace);
  $("#shared-try-btn").addEventListener("click", () => goCaptureFromChallenge(false));
  $("#shared-camera-btn").addEventListener("click", () => goCaptureFromChallenge(true));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !cameraModal.classList.contains("hidden")) closeCamera();
  });

  tryLoadSharedFromHash();
  renderCalipers();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { if (lastAudit) drawShareCard(lastAudit); });
  }
})();
