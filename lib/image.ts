// Ужимает фото в браузере до maxSide по длинной стороне (JPEG). Если браузер
// не смог декодировать файл (например, редкий формат) — возвращает оригинал.
export async function downscaleImage(file: Blob, maxSide: number, quality = 0.85): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const name = file instanceof File ? file.name.replace(/\.\w+$/, "") : "image";
    const original = file instanceof File ? file : new File([file], name, { type: file.type });
    if (scale === 1 && file.size < 1024 * 1024) return original;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return original;
    return new File([blob], name + ".jpg", { type: "image/jpeg" });
  } catch {
    return file instanceof File ? file : new File([file], "image", { type: file.type });
  } finally {
    URL.revokeObjectURL(url);
  }
}
