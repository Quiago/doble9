// lib/chroma.ts — the Manolito/Pollona assets ship as raw greenscreen
// renders (solid chroma + soft edges). The design intent is the puppet on
// transparent; the prototype never keyed them. We key + de-spill at runtime
// so both DOM (<ChromaImg>) and Phaser get clean art, assets untouched.
// AGENT: Frontend.

/** Key out green and de-spill edges, in place. */
function keyGreen(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const excess = g - Math.max(r, b); // how "green" beyond skin/cloth
    if (excess > 60) {
      data[i + 3] = 0; // solid background → transparent
    } else if (excess > 22) {
      data[i + 3] = Math.round((data[i + 3] * (60 - excess)) / 38); // feather
      data[i + 1] = Math.max(r, b); // de-spill the fringe
    } else if (g > (r + b) / 2 + 12) {
      data[i + 1] = Math.round((r + b) / 2 + 12); // mild de-spill on keep
    }
  }
}

/** Draw a green-screened source to a transparent canvas of its native size. */
export function chromaCanvas(
  source: CanvasImageSource,
  w: number,
  h: number,
): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  keyGreen(img.data);
  ctx.putImageData(img, 0, 0);
  return cv;
}

const cache = new Map<string, Promise<string>>();

/** `src` (greenscreen PNG) → cached transparent PNG data URL. */
export function chromaUrl(src: string): Promise<string> {
  const hit = cache.get(src);
  if (hit) return hit;
  const p = new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () =>
      resolve(
        chromaCanvas(img, img.naturalWidth, img.naturalHeight).toDataURL(
          "image/png",
        ),
      );
    img.onerror = reject;
    img.src = src;
  });
  cache.set(src, p);
  return p;
}
