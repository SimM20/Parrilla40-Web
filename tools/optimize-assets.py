"""Rebuild local image/font derivatives. Originals remain unchanged.

QA requirements: Pillow with AVIF/WebP support, fonttools[woff] and brotli.
Run from the repository root. These are authoring tools, not website dependencies.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/optimized"
OUTPUT.mkdir(exist_ok=True)
manifest = {}

# Tiny pixel sprites already compress well as PNG. Convert only the large art
# actually used by the pages, sized for its existing display dimensions at 2x/4x.
for source in sorted((ROOT / "assets").rglob("*.png")):
    if "optimized" in source.parts or source.stat().st_size < 30000:
        continue
    if source.name in ("menu.png", "caja.png"):
        continue  # Not used by the website.
    image = Image.open(source).convert("RGBA")
    max_height = 160 if source.stem == "radio" else 96
    if source.stem == "candado":
        max_height = 244
    variants = []
    for height in (max_height, max_height * 2):
        width = round(image.width * height / image.height)
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        stem = f"{source.stem}-{width}"
        for fmt, options in (("avif", {"quality": 85, "speed": 6}),
                             ("webp", {"lossless": True, "method": 6})):
            resized.save(OUTPUT / f"{stem}.{fmt}", **options)
        variants.append({"width": width, "height": height, "stem": stem})
    manifest[source.relative_to(ROOT).as_posix()] = {
        "width": image.width, "height": image.height, "variants": variants
    }

(OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

# A deterministic social card made entirely from the site's original assets.
for lang, subtitle in (("es", "Simulador de parrilla argentina"),
                       ("en", "An Argentine roadside grill simulator")):
    card = Image.new("RGB", (1200, 630), "#100c0a")
    landscape = Image.open(ROOT / "assets/fondo/paisaje.png").convert("RGBA")
    landscape = landscape.resize((1200, 506), Image.Resampling.NEAREST)
    card.paste(landscape, (0, 345), landscape)
    shade = Image.new("RGBA", card.size, (16, 12, 10, 135))
    card = Image.alpha_composite(card.convert("RGBA"), shade)
    draw = ImageDraw.Draw(card)
    title = ImageFont.truetype(str(ROOT / "fonts/Bungee-Regular.ttf"), 106)
    body = ImageFont.truetype(str(ROOT / "fonts/Nunito-Bold.ttf"), 32)
    small = ImageFont.truetype(str(ROOT / "fonts/Nunito-Regular.ttf"), 24)
    draw.rectangle((72, 78, 144, 86), fill="#ff7a18")
    draw.text((68, 128), "PARRILLA 40", font=title, fill="#ffc043")
    draw.text((72, 306), subtitle, font=body, fill="#f6e8d6")
    draw.text((72, 554), "parrilla40.com.ar", font=small, fill="#f6e8d6")
    card.convert("RGB").save(ROOT / f"assets/og-{lang}.png", optimize=True)

from fontTools import subset
from fontTools.ttLib import TTFont

for source in sorted((ROOT / "fonts").glob("*.ttf")):
    font = TTFont(source)
    options = subset.Options()
    # Latin + extended Latin, punctuation and the symbols used by ES/EN copy.
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=list(range(0x0250)) + list(range(0x2000, 0x2070)) + [0x21BA, 0x2715])
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(source.with_suffix(".woff2"))

print(f"Generated {len(manifest)} image families, two social cards and six WOFF2 fonts.")
