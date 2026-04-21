// unwrap.js
const sharp = require("sharp");
const { Buffer } = require("buffer");

async function polarUnwrap(imageBuffer) {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const size = Math.min(metadata.width, metadata.height);

  // Crop to square center
  const left = Math.floor((metadata.width - size) / 2);
  const top = Math.floor((metadata.height - size) / 2);

  const cropped = sharp(await image.extract({ left, top, width: size, height: size })
    .raw().toBuffer(), { raw: { width: size, height: size, channels: 3 } });

  const pixels = await cropped.raw().toBuffer();
  const center = Math.floor(size / 2);
  const outerR = center;
  const innerR = Math.floor(center * 0.3);
  const ringHeight = outerR - innerR;
  const circumference = Math.floor(2 * Math.PI * ((innerR + outerR) / 2));

  const out = Buffer.alloc(ringHeight * circumference * 3);

  for (let row = 0; row < ringHeight; row++) {
    const radius = innerR + row;
    for (let col = 0; col < circumference; col++) {
      const angle = 2 * Math.PI * (col / circumference);
      const x = Math.floor(radius * Math.cos(angle)) + center;
      const y = Math.floor(radius * Math.sin(angle)) + center;

      if (x >= 0 && x < size && y >= 0 && y < size) {
        const srcIdx = (y * size + x) * 3;
        const dstIdx = (row * circumference + col) * 3;
        out[dstIdx] = pixels[srcIdx];
        out[dstIdx + 1] = pixels[srcIdx + 1];
        out[dstIdx + 2] = pixels[srcIdx + 2];
      }
    }
  }

  // Rotate 180 + flip horizontal (same as your Python: flip(rotate_180, 1))
  return sharp(out, { raw: { width: circumference, height: ringHeight, channels: 3 } })
    .rotate(180)
    .flop()
    .jpeg()
    .toBuffer();
}

module.exports = { polarUnwrap };
