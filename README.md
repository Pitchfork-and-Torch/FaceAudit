# Face Audit

Satirical face roast + shareable score cards. Pure frontend. Nothing leaves the browser.

| Surface | URL |
|---------|-----|
| **Primary** | https://faceaudit.jonbailey.xyz/ |
| Vercel mirror | https://faceaudit.vercel.app/ |
| Pages mirror | https://faceaudit-jonbailey.pages.dev/ |
| FaceAudit.grok.me | DNS reserved (Grok Build Mode "App not Found") - needs xAI verification |

## Features (v4.1 The Calipers)

- Soft / Normal / Savage intensity
- Story 9:16, square 1:1, feed 1.91:1 share cards (watermarked)
- Challenge deep-links (`#r=...`) with beat-their-score CTA + camera
- System share, download PNG, X intent, copy packs
- Findings collapsed by default (card-first UX)
- The Calipers: pin roast cards locally (no photos stored)
- Stochastic calipers - satire, not science
- Honesty readout: roast is file-hash PRNG; local crop/luma/bbox are photo numbers, not bone
- The Calipers refuse selfie bytes in localStorage

## Local

```powershell
cd $env:USERPROFILE\FaceAudit
node tests/honesty.test.js
# preview only if you start a server yourself (not from Grok TUI)
```

## Deploy

```powershell
.\deploy.ps1
py -3 .\scripts\gen_og.py
```

## Disclaimer

Pure satire and entertainment. Not medical advice.

## Related

- https://editbay.jonbailey.xyz/ (long-form media criticism)
- https://jonbailey.xyz/bias-noticer/ (rhetoric highlighter)
- https://veilscan.jonbailey.xyz/ (image mark presence)
