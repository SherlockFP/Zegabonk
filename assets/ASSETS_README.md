# Özel Modeller ve Efektler (GLB)

Bu proje **lokal** kullanım içindir. Aşağıdaki klasörlere GLB dosyalarını koyarsanız oyun bunları kullanır; yoksa varsayılan (procedural) modeller kullanılır.

## Klasör yapısı

| Klasör | Dosya | Açıklama |
|--------|------|----------|
| `assets/maps/` | `arena1.glb`, `arena2.glb`, `arena3.glb` | Özel haritalar (Arena 3: su alanları, yüzme, köpek balıkları) |
| `assets/player/` | `character.glb` | Ana karakter modeli |
| `assets/creatures/` | Aşağıdaki tablo | Yaratık modelleri (isim tam eşleşmeli) |

### Yaratık dosya isimleri (`assets/creatures/`)

Dosyayı indirip **tam bu isimle** koyun (küçük harf):

- `wolf.glb` – Kurt  
- `bear.glb` – Ayı  
- `spider.glb` – Örümcek  
- `skeleton.glb` – İskelet  
- `bat.glb` – Yarasa  
- `slime.glb` – Slime  
- `fox.glb` – Tilki  
- `ghost.glb` – Hayalet  
- `scorpion.glb` – Akrep  
- `boar.glb` – Domuz  
- `polarBear.glb` – Kutup ayısı  
- `void.glb` – Void  
- `horror.glb` – Horror  
- `default.glb` – Varsayılan blob  
- `tree.glb` – Ağaç yaratığı  

İsim eşleşmezse o tip için yine procedural model kullanılır.

---

## Nereden indirebilirsiniz? (Telif sorunu olmaması için CC0 / CC-BY / ücretsiz lisans)

Lokal proje için aşağıdaki kaynaklardan **ücretsiz ve lisanslı** modelleri indirip yukarıdaki isimlere çevirip ilgili klasöre koyabilirsiniz.

### Genel GLB / 3D model siteleri

- **Poly Pizza** – https://poly.pizza  
  Ücretsiz low-poly modeller, GLB/OBJ. Arama: wolf, bear, skeleton, spider vb.

- **Kenney (itch.io)** – https://kenney.itch.io  
  “Asset packs”, “3D”, “Characters”, “Enemies” – çoğu CC0.

- **Sketchfab** – https://sketchfab.com  
  Filtre: “Downloadable”, “CC0” veya “CC-BY”. GLB export var.

- **OpenGameArt** – https://opengameart.org  
  “3D Models”, lisans: CC0, CC-BY. Bazen OBJ/FBX; Blender ile GLB’ye çevrilebilir.

- **itch.io** – https://itch.io/game-assets/free/tag-3d  
  “Free”, “3D”, “Characters” / “Creatures”. Lisansı sayfada yazar.

- **Quaternius (CC0)** – https://quaternius.com  
  Ücretsiz paketler: animals, characters. Genelde FBX/OBJ; GLB’ye çevrilebilir.

### Harita (arena)

- **Poly Pizza** – “arena”, “dungeon”, “environment”  
- **Sketchfab** – “game environment”, “arena”, lisans CC0/CC-BY  
- **Kenney** – “Tiny Dungeon”, “Kitbash” vb. paketler  

### Karakter (oyuncu)

- **Mixamo** – https://mixamo.com (Adobe) – Karakterler ücretsiz, GLB export  
- **Poly Pizza** – “character”, “knight”, “warrior”  
- **Kenney** – “Character” paketleri  

### Efekt / VFX (ileride kullanım için)

- **Kenney** – “Particle pack”, “VFX”  
- **OpenGameArt** – “Effects”, “Spells”  
- **itch.io** – “VFX”, “Effects” (lisansı kontrol edin)  

Efektler şu an kodla (ring, burst, projectile) yapılıyor; ileride `assets/effects/` altında texture veya 3D efekt asset’leri eklenebilir.

---

## Önemli

1. **Lisans:** Sadece **CC0, CC-BY** veya “free for personal/commercial” gibi açıkça izin veren modelleri kullanın. Her kaynakta lisansı okuyun.  
2. **İsimler:** Yaratıklar için dosya isimleri yukarıdaki tablodaki gibi **tam** olmalı (örn. `wolf.glb`).  
3. **Format:** GLB tercih edilir. OBJ/FBX indirirseniz Blender ile File → Export → glTF 2.0 (GLB) ile dönüştürün.  
4. **Boyut:** Modeller çok büyük olmasın; oyun otomatik ölçekler ama çok detaylı modeller FPS’i düşürebilir.  

Bu dosya sadece rehberdir; modelleri siz indirip ilgili klasörlere koyacaksınız. Oyun, dosya varsa onu kullanır, yoksa varsayılan modellere geri döner.

---

## Yüklü modeller — Kaynak & lisans (CC Attribution)

Aşağıdaki 5 model Sketchfab'dan indirilmiş ve **CC Attribution** lisansıyla kullanılmaktadır. Kullanımda yazar adı ve kaynak atfı zorunludur.

| Model | Dosya | Sketchfab yazarı | Sketchfab UID | Lisans |
|-------|-------|------------------|---------------|--------|
| Low Poly Ghost | `assets/creatures/ghost.glb` | Jenna-W | `62e2b3e9db77443b88a7341ac0032e3b` | CC Attribution |
| PSX Horror Creature | `assets/creatures/horror.glb` | RunBunStudios | `f2cb965d13df49f2a9c78c3358386076` | CC Attribution |
| Low Poly Wild Boar | `assets/creatures/boar.glb` | Hanabi_Map | `c629c82f34754fd09230b2c9563296ac` | CC Attribution |
| Low Poly - Polar Bear | `assets/creatures/polarBear.glb` | Gouw | `744849f988f148749245c8115eec046e` | CC Attribution |
| Shadowsail | `assets/creatures/void.glb` | Alx_Olotl | `dd453c67708d46189100fa63111b59cd` | CC Attribution |

Model sayfaları: `https://sketchfab.com/3d-models/<UID>` (ör. ghost için `https://sketchfab.com/3d-models/62e2b3e9db77443b88a7341ac0032e3b`).
