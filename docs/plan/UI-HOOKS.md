# UI-HOOKS - app.js entegrasyon listesi (P6)

CSS/HTML tarafi bitti. Asagidakiler `app.js` ajaninin tek geciste baglamasi icin.

## Yeni class/id (CSS hazir, JS henuz baglamadi)

| Selector | Ne zaman | Ne yapmali |
|---|---|---|
| `.card.rarity-common` `.card.rarity-magic` `.card.rarity-rare` `.card.rarity-unique` `.card.rarity-boss` | `renderLevelupCards` (~13498) | Mevcut `card ${rarity}` yanina `rarity-${rarity}` ekle. `legendary` icin `rarity-boss` (veya her ikisi). Eski `.card.magic` stilleri de duruyor. |
| `.cardIcon` | her levelup karti | `<span class="cardIcon"><img src="assets/icons/...." alt=""></span>` (emoji degil). Placeholder SVG: `assets/ui/icon-card.svg`. Chest zaten `.cardIcon` kullaniyor. |
| `.cardStat` | her kart | Su an yalniz crit kartlarinda var. Hepsi icin: `Hasar 24 -> 31` / `+7 hasar` satiri. |
| `.synergyBadge` | kartta eslesen skill varsa | Ornek: `<span class="synergyBadge">Fireball ile birlesir</span>`. Yoksa node ekleme. |
| `.card.picked` | `chooseLevelCard` | Secilen karta class ekle (patlama animasyonu), sonra kapat. |
| `#xpBarBottom.xpBarFlash` | `openLevelup` | Class ekle; ~600ms sonra kaldir. |
| `.gameLogoText` `.gameLogoTag` `.gameLogoMark` | start screen | Sadece HTML/CSS. JS dokunmasin. |
| `.startNameInput` `.startNameRow` `.levelupTitle` `.levelupColTitle` `.rerollBtn` | markup | Id'ler ayni (`playerNameInput`, `rerollBtn`, `rerollCount`). |

## `renderLevelupCards` hedef DOM

```
<article class="card magic rarity-magic">
  <span class="cardIcon"><img src="assets/icons/fireball.svg" alt=""></span>
  <h3>1. Fireball hasar</h3>
  <span class="badge rarity-magic">MAGIC</span>
  <p>Fireball daha tesirli.</p>
  <div class="cardStat">Hasar 24 -> 31</div>
  <span class="synergyBadge">Fireball ile birlesir</span>
</article>
```

Mevcut cikti (`h3` + `badge` + `p` + opsiyonel `cardStat`) CSS grid ile yerlesiyor; ikon yoksa placeholder kutu gosterilir.

## P6.1 diorama (CSS yapamaz)

- `#startScreen` overlay artik daha seffaf; canvas arkadan gorunmeli.
- Menu donusunde `canvas.style.display = "none"` kapatilmamali (app.js ~4670).
- Idle voxel diorama: karakter + 1-2 dusman. JS isi.

## Overlay fade

`.overlay` / `.overlay.hidden` 150ms opacity. JS ayni `hidden` class'ini kullanmaya devam etsin. HUD `.hidden` (overlay olmayan) `display:none` kalir.

## Kalan emoji (HTML disi / JS)

Bu ajan yalniz start / lobby / levelup static HTML'deki emojileri sildi.

JS (app.js, dokunulmadi):
- ~927 basari toast (kupa emoji + BASARI metni)
- ~9717 / ~9782 sandik `.cardIcon` paket emojisi
- ~13517 levelup sol liste (Aktif / Pasif baslik emojileri)
- ~13522-13536 levelup sag stat satirlari (HP, kalkan, hasar, ...)
- ~14094-14109 aktif efekt ikonlari (Rage, Bloodlust, Insta Kill, Magnet, Dodge)
- ~14238-14241 ve ~14269-14271 skill strip / HUD ikon map (`skillStripEmoji`)
- ~14223 `.effectIcon` icine ayni emoji stringleri

HTML (bu ajanin izni yoktu):
- `#chestPanel` h2 sandik emojisi
- `#gameOver` h2 kurukafa
- `#epilepsyNotice` uyari isareti
- `#ritualHint` / pause / skill tree metinleri (diacritic + emoji yok ama JS disi)

## app.js ajaninin P6 bitirme checklisti

1. Kart class: `rarity-${rarity}` + `.cardIcon` + her kartta `.cardStat` + varsa `.synergyBadge`.
2. Emoji -> SVG (`assets/icons/*` veya `assets/ui/*`).
3. `#xpBarBottom` uzerine levelup'ta `.xpBarFlash`.
4. Secimde `.card.picked`.
5. Start menude canvas'i gizleme; voxel diorama.
6. Levelup sol/sag listelerdeki emoji basliklari ASCII yap.

Id degistirme: `startScreen`, `playBtn`, `cardRow`, `rerollBtn`, `rerollCount`, `levelup`, `xpBarBottom`, HUD chip id'leri ayni kalmali.
