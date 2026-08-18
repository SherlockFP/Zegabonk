import shutil, subprocess
from pathlib import Path

og = Path(r"C:\Users\Sher\Desktop\ZegabonkOG")
sib = Path(r"C:\Users\Sher\Desktop\zegabonk")

def git(*args, cwd=sib):
    p = subprocess.run(["git", "-C", str(cwd), *args], capture_output=True, text=True, encoding="utf-8", errors="replace")
    print("git", " ".join(args), "->", p.returncode)
    if p.stdout: print(p.stdout[:4000])
    if p.stderr: print(p.stderr[:4000])
    return p

# Restore accidental deletions in sibling working tree (keep our later copies)
git("checkout", "--", "assets", "maps", "tools", "package.json", "package-lock.json", "playwright.config.js", "render.yaml", "background.mp3")

# Copy ship files
for name in ["app.js", "index.html", "styles.css"]:
    shutil.copy2(og / name, sib / name)
    print("copied", name, (sib / name).stat().st_size)

# Copy creature/hero assets that exist in OG
pairs = [
    ("assets/creatures", "assets/creatures"),
    ("assets/models/creatures", "assets/models/creatures"),
    ("assets/models/production", "assets/models/production"),
    ("assets/ui", "assets/ui"),
]
copied = 0
for src_rel, dst_rel in pairs:
    src = og / src_rel
    dst = sib / dst_rel
    if not src.exists():
        continue
    dst.mkdir(parents=True, exist_ok=True)
    for f in src.iterdir():
        if f.is_file() and f.suffix.lower() in {".glb", ".png", ".webp", ".jpg"}:
            target = dst / f.name
            shutil.copy2(f, target)
            copied += 1
print("copied assets", copied)

# Clean temp qa helpers from OG if they leaked
for junk in ["tools/qa/_gitinfo.py", "tools/qa/_gitinfo.txt", "tools/qa/_cmp.py", "tools/qa/_patch_toon.py", "tools/qa/_probe.py", "tools/qa/_snip.txt"]:
    p = og / junk
    if p.exists():
        p.unlink()
        print("removed", junk)
