# Deploy Face Audit to Cloudflare Pages + optional domain attach
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Project = "faceaudit-jonbailey"

if (-not (Test-Path (Join-Path $Root "index.html"))) { Write-Error "Missing index.html" }
if (-not (Test-Path (Join-Path $Root "og.jpg"))) { Write-Error "Missing og.jpg - run scripts/gen_og.py" }

Write-Host "[DEPLOY] Face Audit Pages project=$Project" -ForegroundColor Cyan
$skip = @("scripts", "deploy.ps1", "NEXT.md", "README.md", "CLAUDE.md", "AGENTS.md", ".git", ".wrangler", "tests", "7577922ed4d3ec3df303933b78cbd0ee.txt")
$stage = Join-Path $env:TEMP "faceaudit-pages-stage"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null
Get-ChildItem -LiteralPath $Root -Force | Where-Object { $skip -notcontains $_.Name } | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $stage $_.Name) -Recurse -Force
}
Push-Location $Root
try {
  npx --yes wrangler pages deploy $stage --project-name=$Project --commit-dirty=true
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Pages:   https://$Project.pages.dev/"
Write-Host "Custom:  https://faceaudit.jonbailey.xyz/  (if domain attached)"
Write-Host "Target:  https://FaceAudit.grok.me/        (Vercel / Grok host)"
Write-Host "Source:  $Root"
