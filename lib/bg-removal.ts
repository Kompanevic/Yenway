import { downscaleImage } from "./image";

const PKG_VERSION = "1.7.0";
// Модели лежат в отдельном пакете -data (это дефолт самой библиотеки).
const ASSETS_PATH = `https://staticimgly.com/@imgly/background-removal-data/${PKG_VERSION}/dist/`;

// На CDN IMG.LY не для каждой версии опубликованы все варианты модели —
// перебираем по очереди. quint8 самая лёгкая; рабочая встаёт первой.
const MODEL_VARIANTS = ["isnet_quint8", "isnet_fp16", "isnet"];

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
}

type BgModule = {
  removeBackground: (file: Blob, config?: Record<string, unknown>) => Promise<Blob>;
  preload?: (config?: Record<string, unknown>) => Promise<void>;
};

let modulePromise: Promise<BgModule> | null = null;

function loadModule(): Promise<BgModule> {
  // Тяжёлая WASM/ONNX-библиотека только для браузера — грузим ESM с CDN в
  // рантайме, мимо сборки webpack (в бандле она ломает билд из-за import.meta).
  const cdnUrl = `https://cdn.jsdelivr.net/npm/@imgly/background-removal@${PKG_VERSION}/+esm`;
  modulePromise ??= withTimeout(
    // @ts-ignore — динамический импорт по URL, TypeScript не резолвит типы CDN-модуля
    import(/* webpackIgnore: true */ cdnUrl) as Promise<BgModule>,
    20000,
    "Не удалось загрузить модуль вырезки фона (проверьте интернет)"
  ).catch((e) => {
    modulePromise = null;
    throw e;
  });
  return modulePromise;
}

// Начать качать модель заранее (например, пока пользователь выбирает фото).
export function warmUpBgRemoval() {
  loadModule()
    .then((mod) => mod.preload?.({ publicPath: ASSETS_PATH, model: MODEL_VARIANTS[0] }))
    .catch(() => {});
}

// Возвращает PNG с прозрачным фоном.
export async function removeBackground(input: Blob): Promise<Blob> {
  const [mod, file] = await Promise.all([loadModule(), downscaleImage(input, 1024, 0.9)]);
  let lastErr: unknown = null;
  for (const model of [...MODEL_VARIANTS]) {
    try {
      const blob = await withTimeout(
        mod.removeBackground(file, { publicPath: ASSETS_PATH, model }),
        60000,
        "Модель вырезки фона не ответила за 60 секунд"
      );
      MODEL_VARIANTS.splice(MODEL_VARIANTS.indexOf(model), 1);
      MODEL_VARIANTS.unshift(model);
      return blob;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
