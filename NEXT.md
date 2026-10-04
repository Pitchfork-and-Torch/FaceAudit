# Face Audit next

## Done 2026-08-28
- **4.1.0 The Calipers:** pin roast cards in this browser (no photos stored). Fontshare Clash Display + Satoshi self-hosted.

## Done 2026-09-17 (honesty cut, still 4.1.0)
- Measurement honesty: roast is file-hash PRNG. Local crop, luma, optional face box are photo geometry, not bone.
- Calipers sanitize: drop rows that contain image/data-URL bytes. Tests in `tests/honesty.test.js`.
- Caliper desk stays visible (moved out of the upload panel). Camera dialog traps focus. Focus-visible on controls.
- No version bump. Honesty copy is the cut.

## Done 2026-10-04
- **4.2.0 Edge Density:** mean neighbor contrast on a 32x32 luma sample. Shown as pixels. Score stays file-hash PRNG. Calipers still store no photos.

## Next low-risk
- Do not add more pixel cues unless asked.
- EN only. ASCII dashes.
