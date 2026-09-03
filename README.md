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
- Challenge deep-links (`#r=…`) with beat-their-score CTA + camera
- System share, download PNG, X intent, copy packs
- Findings collapsed by default (card-first UX)
- The Calipers: pin roast cards locally (no photos stored)
- Stochastic calipers - satire, not science

## Local

```powershell
cd $env:USERPROFILE\FaceAudit
py -3 -m http.server 8765
```

## Deploy

```powershell
.\deploy.ps1
py -3 .\scripts\gen_og.py
```

## Disclaimer

Pure satire and entertainment. Not medical advice.
