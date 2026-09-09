"""
Slice the GPT contact sheet into individual assets and recover a real
alpha channel from the painted checkerboard.

The source is 24-bit RGB: "transparency" is a drawn 16px checker of
#FEFEFE / #EFEFEF. We key that out, flood-fill from the borders so
interior highlights survive, decontaminate the edge pixels so scaling
doesn't pull white fringe into the tears, then split the sheet into
its four assets by row/column projection.
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC = Path(r"C:\Users\senpa\OneDrive\Desktop\Ashforge\SitesandApps\Ashforge-Studio-LLC\uploads\ashforge_bottom_right_clean_assets\transparent assets.png")
OUT = Path(r"C:\Users\senpa\OneDrive\Desktop\Ashforge\SitesandApps\Ashforge-Studio-LLC\uploads\texture")
OUT.mkdir(parents=True, exist_ok=True)

im = Image.open(SRC).convert("RGB")
rgb = np.asarray(im).astype(np.int16)
h, w, _ = rgb.shape

# ── 1. Checker mask: near-neutral and bright ────────────────────────
mx = rgb.max(axis=2)
mn = rgb.min(axis=2)
neutral = (mx - mn) <= 10
bright = mn >= 226
checker = neutral & bright

# ── 2. Flood from the borders so enclosed light areas stay opaque ───
outside = np.zeros((h, w), dtype=bool)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if checker[y, x] and not outside[y, x]:
            outside[y, x] = True
            q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if checker[y, x] and not outside[y, x]:
            outside[y, x] = True
            q.append((y, x))

while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and checker[ny, nx] and not outside[ny, nx]:
            outside[ny, nx] = True
            q.append((ny, nx))

opaque = ~outside
print(f"opaque coverage: {opaque.mean():.1%}")

# ── 3. Edge decontamination ─────────────────────────────────────────
# Transparent pixels keep whatever white was painted there. When the
# image is scaled that white bleeds into the tear. Push interior colour
# outward a few rings so the fringe is paper-coloured, not white.
work = rgb.copy()
known = opaque.copy()
for _ in range(4):
    unknown = ~known
    if not unknown.any():
        break
    acc = np.zeros((h, w, 3), dtype=np.float32)
    cnt = np.zeros((h, w), dtype=np.float32)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        shifted_c = np.roll(work, (dy, dx), axis=(0, 1)).astype(np.float32)
        shifted_k = np.roll(known, (dy, dx), axis=(0, 1))
        acc += shifted_c * shifted_k[..., None]
        cnt += shifted_k
    fill = unknown & (cnt > 0)
    work[fill] = (acc[fill] / cnt[fill][..., None]).astype(np.int16)
    known |= fill

# ── 4. Soften alpha by a hair to kill the 1px stair-stepping ────────
alpha = Image.fromarray((opaque * 255).astype(np.uint8), mode="L")
alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
a = np.asarray(alpha).astype(np.float32)
a = np.clip((a - 96) * (255.0 / (255 - 96)), 0, 255)  # re-tighten after blur

sheet = np.dstack([work.astype(np.uint8), a.astype(np.uint8)])
sheet_img = Image.fromarray(sheet, mode="RGBA")

# ── 5. Split into assets by connected component ─────────────────────
# A row/column projection fails here: the torn strip's ragged underside
# overlaps the map's top edge vertically. Label instead, dilating first
# so a thin ornament doesn't shatter into fragments.
from scipy import ndimage

solid = a > 40
grown = ndimage.binary_dilation(solid, iterations=5)
labels, n = ndimage.label(grown)
print(f"components: {n}")

regions = []
for sl in ndimage.find_objects(labels):
    ys, xs = sl
    sub = solid[ys, xs]
    if sub.sum() < 4000:
        continue
    yy, xx = np.nonzero(sub)
    regions.append((
        xs.start + int(xx.min()), ys.start + int(yy.min()),
        xs.start + int(xx.max()) + 1, ys.start + int(yy.max()) + 1,
    ))

regions.sort(key=lambda r: (r[1] // 100, r[0]))
for r in regions:
    print("region", r, "=>", r[2] - r[0], "x", r[3] - r[1])

def despeckle(img, min_area):
    """Drop small disconnected fragments - the source sheet has debris
    floating below the torn strip that would render as dirt specks."""
    arr = np.array(img)
    m = arr[..., 3] > 40
    lab, k = ndimage.label(m)
    if k <= 1:
        return img
    sizes = ndimage.sum(m, lab, range(1, k + 1))
    keep = np.zeros(k + 1, dtype=bool)
    keep[1:] = sizes >= min_area
    arr[..., 3] = np.where(keep[lab], arr[..., 3], 0)
    return Image.fromarray(arr, mode="RGBA")


NAMES = ["torn-edge", "map", "dark-panel", "divider"]
saved = []
crops = {}
for name, box in zip(NAMES, regions):
    crop = sheet_img.crop(box)
    crop = despeckle(crop, 2500 if name != "divider" else 300)
    bbox = crop.getbbox()
    if bbox:
        crop = crop.crop(bbox)
    crops[name] = crop
    crop.save(OUT / f"{name}.png")
    crop.save(OUT / f"{name}.webp", quality=88, method=6)
    saved.append((name, crop.size, (OUT / f"{name}.webp").stat().st_size))

# A mask whose top is solid and whose bottom carries the torn contour.
# Used to tear the hero section itself away over the dark band, instead
# of laying a separate paper strip across the artwork - a strip cuts
# straight through whatever it covers (the map's compass, for one).
t_full = np.array(crops["torn-edge"])
tear_rows = t_full[150:, :, 3]
mask = np.zeros((tear_rows.shape[0], tear_rows.shape[1], 4), dtype=np.uint8)
mask[..., :3] = 255
mask[..., 3] = tear_rows
tear_img = Image.fromarray(mask, mode="RGBA")
tear_img.save(OUT / "tear-mask.png")
# Mirrored, so a second boundary using the same source reads as a
# different rip. Flipped vertically for sections torn along their top.
tear_img.transpose(Image.FLIP_LEFT_RIGHT).save(OUT / "tear-mask-flip.png")
tear_img.transpose(Image.FLIP_TOP_BOTTOM).save(OUT / "tear-mask-top.png")
for nm in ("tear-mask", "tear-mask-flip", "tear-mask-top"):
    saved.append((nm, (mask.shape[1], mask.shape[0]), (OUT / f"{nm}.png").stat().st_size))

# Pull a clean paper tile out of the strip's opaque middle. Stretching
# the whole strip to fill the sheet smears its fibres into vertical
# streaks that read as wood; a mirror-tiled patch keeps the grain honest.
t = np.array(crops["torn-edge"])
ta = t[..., 3]
th, tw = ta.shape
xs0, xs1 = int(tw * 0.15), int(tw * 0.85)
rows = [y for y in range(th) if (ta[y, xs0:xs1] > 252).all()]
# longest contiguous run of fully opaque rows
best = cur = []
for y in rows:
    if cur and y == cur[-1] + 1:
        cur.append(y)
    else:
        cur = [y]
    if len(cur) > len(best):
        best = cur
y0, y1 = best[0], best[-1] + 1
patch = Image.fromarray(t[y0:y1, xs0:xs1, :3], mode="RGB")
pw, ph = patch.size
side = min(pw, ph)
patch = patch.crop(((pw - side) // 2, 0, (pw - side) // 2 + side, ph))


def high_pass(img, sigma):
    """Keep fine grain, drop large-scale blotches.

    Tiling the raw patch grids its big stains across the page, and
    mirroring turns each one into an obvious symmetric rosette. Removing
    the low frequencies leaves texture that repeats invisibly; the flat
    colour underneath supplies the tone.
    """
    a = np.asarray(img).astype(np.float32)
    blur = np.dstack([ndimage.gaussian_filter(a[..., c], sigma) for c in range(a.shape[2])])
    return Image.fromarray(np.clip(a - blur + 128, 0, 255).astype(np.uint8), mode="RGB")


def mirror_tile(img):
    w_, h_ = img.size
    out = Image.new("RGB", (w_ * 2, h_ * 2))
    out.paste(img, (0, 0))
    out.paste(img.transpose(Image.FLIP_LEFT_RIGHT), (w_, 0))
    out.paste(img.transpose(Image.FLIP_TOP_BOTTOM), (0, h_))
    out.paste(img.transpose(Image.ROTATE_180), (w_, h_))
    return out


paper = mirror_tile(high_pass(patch, 18))
paper.save(OUT / "paper-tile.webp", quality=84, method=6)
saved.append(("paper-tile", paper.size, (OUT / "paper-tile.webp").stat().st_size))
print(f"paper tile from rows {y0}-{y1}")

# The dark panel is a torn square. Used as a background it is scaled to
# cover, which drags its own ragged borders into view. Keep the interior
# only, and mirror-tile it so the band can be any width without a seam.
d = crops["dark-panel"].convert("RGB")
dw, dh = d.size
core = d.crop((int(dw * 0.14), int(dh * 0.14), int(dw * 0.86), int(dh * 0.86)))
# Same treatment, gentler - the dark ground hides repetition better, so
# keep more of its mottling.
tile = mirror_tile(high_pass(core, 46))
tile.save(OUT / "dark-panel.webp", quality=82, method=6)
saved = [s for s in saved if s[0] != "dark-panel"]
saved.append(("dark-panel", tile.size, (OUT / "dark-panel.webp").stat().st_size))

for name, size, nbytes in saved:
    print(f"{name:12} {size[0]}x{size[1]:<5} webp={nbytes/1024:.0f} KB")
