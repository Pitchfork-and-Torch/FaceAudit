from pathlib import Path

raw = Path.home().joinpath(".grok/secrets/vercel_token.txt").read_text(encoding="utf-8")
lines = [l.strip() for l in raw.splitlines() if l.strip() and not l.strip().startswith("#")]
tok = lines[0] if lines else ""
tok = tok.strip().strip('"').strip("'")
if "=" in tok and not tok.lower().startswith("vercel_"):
    # KEY=value form
    tok = tok.split("=", 1)[1].strip().strip('"').strip("'")
out = Path(__file__).resolve().parents[1] / ".vercel_tok_clean"
out.write_text(tok, encoding="utf-8")
print("len", len(tok))
print("has_space", " " in tok)
print("has_hash", "#" in tok)
print("prefix", tok[:4] if tok else "empty")
