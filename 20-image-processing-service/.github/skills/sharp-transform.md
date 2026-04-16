---
name: sharp-transform
description: >
  All Sharp transformation patterns used in imageService.js.
  Use when adding new transformation types or debugging the Sharp pipeline.
---

# Sharp Transform Skill

Docs: https://sharp.pixelplumbing.com/

## Pipeline order (always follow this sequence)
1. `rotate` → 2. `flip/flop` → 3. `resize` → 4. `extract (crop)` → 5. filters → 6. `composite (watermark)` → 7. format/compression

## Full pipeline reference
```js
let p = sharp(inputPath)
if (rotate)          p = p.rotate(rotate)
if (flip)            p = p.flip()
if (mirror)          p = p.flop()
if (resize)          p = p.resize({ width, height, fit: 'inside', withoutEnlargement: true })
if (crop)            p = p.extract({ left: crop.x, top: crop.y, width: crop.width, height: crop.height })
if (grayscale)       p = p.grayscale()
if (sepia)           p = p.recomb([[0.3588,0.7044,0.1368],[0.299,0.587,0.114],[0.2392,0.4696,0.0912]])
if (watermark)       p = p.composite([{ input: svgBuffer, gravity: 'southeast' }])
if (format==='webp') p = p.webp({ quality: compress ?? 85 })
const info = await p.toFile(outputPath)  // returns { format, width, height, size }
```

## Blurhash
```js
const { data, info } = await sharp(path).raw().ensureAlpha()
  .resize(32, 32, { fit: 'inside' }).toBuffer({ resolveWithObject: true })
return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4)
```

## Error handling
```js
// 'Input file is missing' → 404
// 'Unsupported image format' → 400
// All others → 500
```
