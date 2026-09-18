from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

out = Path(__file__).resolve().parents[1]
W, H = 1200, 630
img = Image.new("RGB", (W, H), "#050508")
d = ImageDraw.Draw(img)

for x in range(0, W, 48):
    d.line([(x, 0), (x, H)], fill="#0a1a16")
for y in range(0, H, 48):
    d.line([(0, y), (W, y)], fill="#0a1a16")

base = img.convert("RGBA")
for cx, cy, r, col in [
    (220, 180, 280, (0, 255, 200)),
    (980, 480, 320, (255, 45, 149)),
]:
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(r, 0, -6):
        a = int(28 * (i / r))
        od.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(col[0], col[1], col[2], a))
    base = Image.alpha_composite(base, overlay)

img = base.convert("RGB")
d = ImageDraw.Draw(img)
d.rounded_rectangle([36, 36, W - 36, H - 36], radius=24, outline="#00ffc8", width=2)


def font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()


d.text((70, 70), "FACE AUDIT", fill="#00ffc8", font=font(28, True))
d.text((70, 115), "Roast your face. Share the card.", fill="#7a8a86", font=font(26))
d.text((70, 220), "7.2", fill="#00ffc8", font=font(140, True))
d.text((340, 300), "/ 10", fill="#7a8a86", font=font(42, True))
d.text((70, 400), "ARCHETYPE  ·  Long Midface Menace", fill="#ff2d95", font=font(28, True))
d.text((70, 455), "Upload  ·  Score  ·  Challenge a friend", fill="#e8f0ee", font=font(30))
d.text((70, 540), "faceaudit.jonbailey.xyz  ·  satire only  ·  not science", fill="#5ad4b8", font=font(22))

img.save(out / "og.jpg", "JPEG", quality=90, optimize=True)
img.save(out / "og.png", "PNG", optimize=True)
img.save(out / "share-card.jpg", "JPEG", quality=90, optimize=True)
print("ok", (out / "og.jpg").stat().st_size)
