from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = (root / "app.js").read_text(encoding="utf-8", errors="replace").splitlines()
out = [
    "# app.js function dump (%d lines)" % len(src),
    "",
    "Generated. Prefer grouped ranges in HOTSPOTS.md.",
    "",
]
for i, line in enumerate(src, 1):
    s = line.strip()
    if s.startswith("function "):
        name = s.split("(")[0][9:].strip()
        out.append("- %d %s" % (i, name))
(root / "mem" / "FUNCTIONS.md").write_text("\n".join(out) + "\n", encoding="utf-8")
print("wrote mem/FUNCTIONS.md", len(out), "lines")
