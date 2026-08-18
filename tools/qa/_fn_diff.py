import re, subprocess
from pathlib import Path

sib = Path(r"C:\Users\Sher\Desktop\zegabonk")
og = Path(r"C:\Users\Sher\Desktop\ZegabonkOG")
head = subprocess.check_output(["git", "-C", str(sib), "show", "HEAD:app.js"], encoding="utf-8", errors="replace")
ogt = (og / "app.js").read_text(encoding="utf-8")
pat = re.compile(r"^function ([A-Za-z0-9_]+)\(", re.M)
hf = set(pat.findall(head))
of = set(pat.findall(ogt))
only_head = sorted(hf - of)
only_og = sorted(of - hf)
print("HEAD funcs", len(hf), "OG funcs", len(of))
print("ONLY HEAD", len(only_head))
print("\n".join(only_head[:80]))
print("--- ONLY OG", len(only_og))
print("\n".join(only_og[:80]))
