import { removeBackground } from "./bg-removal";

const CARD = 1080;

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось открыть изображение"));
    img.src = URL.createObjectURL(blob);
  });
}

// Обрезает прозрачные края (если trim) и вписывает вещь в чёрный квадрат.
export async function composeOnBlack(blob: Blob, trim: boolean): Promise<Blob> {
  const img = await blobToImage(blob);
  let [sx, sy, sw, sh] = [0, 0, img.naturalWidth, img.naturalHeight];
  if (trim) {
    const c = document.createElement("canvas");
    c.width = sw;
    c.height = sh;
    const cx = c.getContext("2d")!;
    cx.drawImage(img, 0, 0);
    const { data } = cx.getImageData(0, 0, sw, sh);
    let [minX, minY, maxX, maxY] = [sw, sh, -1, -1];
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        if (data[(y * sw + x) * 4 + 3] > 16) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX >= minX) [sx, sy, sw, sh] = [minX, minY, maxX - minX + 1, maxY - minY + 1];
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = CARD;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CARD, CARD);
  const box = CARD * 0.84;
  const scale = Math.min(box / sw, box / sh);
  const [w, h] = [sw * scale, sh * scale];
  ctx.drawImage(img, sx, sy, sw, sh, (CARD - w) / 2, (CARD - h) / 2, w, h);
  URL.revokeObjectURL(img.src);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Не удалось собрать картинку"))), "image/jpeg", 0.92)
  );
}

// Вырезает фон и кладёт вещь на чёрный квадрат; если вырезать не вышло —
// исходное фото на чёрном фоне и пояснение в note.
export async function cutoutOnBlack(source: Blob): Promise<{ card: Blob | null; note: string | null }> {
  try {
    return { card: await composeOnBlack(await removeBackground(source), true), note: null };
  } catch (e) {
    return {
      card: await composeOnBlack(source, false).catch(() => null),
      note: `Фон вырезать не удалось (${e instanceof Error ? e.message : "ошибка"}) — будет исходное фото на чёрном фоне.`
    };
  }
}
