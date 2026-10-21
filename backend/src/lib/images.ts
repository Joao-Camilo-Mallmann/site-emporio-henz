import { BadRequestError } from "@/lib/errors";

// Formatos aceitos na entrada (RNF02), conferidos pelo conteúdo do arquivo.
export const ACCEPTED_IMAGE_FORMATS = ["jpeg", "png", "webp"] as const;
export type AcceptedImageFormat = (typeof ACCEPTED_IMAGE_FORMATS)[number];

// Um arquivo pequeno que declara um canvas gigante é recusado antes de qualquer
// pixel ser alocado (40 MP ≈ 160 MB de RAM decodificada).
export const MAX_IMAGE_PIXELS = 40_000_000;

// A miniatura do catálogo precisa ficar abaixo de 50 KB (PRD).
export const THUMBNAIL_MAX_BYTES = 50 * 1024;

export type ImagePreset = "thumb" | "full" | "sample";

export interface ImagePresetConfig {
  // Lado maior em pixels; imagens menores não são ampliadas.
  maxSide: number;
  // Qualidades WebP tentadas em ordem até o resultado caber em `maxBytes`.
  qualities: readonly number[];
  maxBytes?: number;
  // Lados menores tentados quando nenhuma qualidade cabe em `maxBytes`.
  fallbackSides?: readonly number[];
}

export const IMAGE_PRESETS: Record<ImagePreset, ImagePresetConfig> = {
  thumb: {
    maxSide: 480,
    qualities: [75, 60, 45],
    maxBytes: THUMBNAIL_MAX_BYTES,
    fallbackSides: [400, 320, 240],
  },
  full: { maxSide: 1920, qualities: [85] },
  sample: { maxSide: 512, qualities: [80] },
};

export interface ProcessedImage {
  bytes: Uint8Array;
  width: number;
  height: number;
  quality: number;
}

export const ACCEPTED_FORMATS_MESSAGE =
  "Formato de imagem não aceito. Envie um arquivo JPEG, PNG ou WebP.";
export const TOO_MANY_PIXELS_MESSAGE =
  "A imagem tem dimensões excessivas; o limite é 40 megapixels.";
export const THUMBNAIL_TOO_LARGE_MESSAGE =
  "Não foi possível gerar uma miniatura abaixo de 50 KB para esta imagem.";
export const UNREADABLE_IMAGE_MESSAGE =
  "Não foi possível ler a imagem. Envie um arquivo JPEG, PNG ou WebP válido.";

function createImage(bytes: Uint8Array): Bun.Image {
  // `autoOrient` (padrão) aplica a rotação do EXIF antes de descartá-lo.
  return new Bun.Image(bytes, { maxPixels: MAX_IMAGE_PIXELS });
}

function isImageError(error: unknown): error is Error & { code: string } {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return (
    typeof code === "string" &&
    (code.startsWith("ERR_IMAGE_") || code === "ERR_INVALID_STATE")
  );
}

// Erros do Bun.Image são culpa do arquivo enviado, então viram 400. Qualquer
// outro erro é repropagado para virar 500 no errorHandler.
function toBadRequest(error: unknown): unknown {
  if (!isImageError(error)) return error;
  switch (error.code) {
    case "ERR_IMAGE_TOO_MANY_PIXELS":
      return new BadRequestError(TOO_MANY_PIXELS_MESSAGE);
    case "ERR_IMAGE_UNKNOWN_FORMAT":
    case "ERR_IMAGE_FORMAT_UNSUPPORTED":
      return new BadRequestError(ACCEPTED_FORMATS_MESSAGE);
    default:
      return new BadRequestError(UNREADABLE_IMAGE_MESSAGE);
  }
}

export function isAcceptedImageFormat(
  format: string,
): format is AcceptedImageFormat {
  return (ACCEPTED_IMAGE_FORMATS as readonly string[]).includes(format);
}

// Lê só o cabeçalho: confere formato e dimensões sem decodificar a imagem.
export async function readImageMetadata(
  bytes: Uint8Array,
): Promise<Bun.Image.Metadata> {
  let metadata: Bun.Image.Metadata;
  try {
    metadata = await createImage(bytes).metadata();
  } catch (error) {
    throw toBadRequest(error);
  }

  if (!isAcceptedImageFormat(metadata.format)) {
    throw new BadRequestError(ACCEPTED_FORMATS_MESSAGE);
  }
  if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw new BadRequestError(TOO_MANY_PIXELS_MESSAGE);
  }

  return metadata;
}

// Reconverte a imagem para WebP no preset pedido. A reconversão descarta os
// metadados EXIF (inclusive GPS) e neutraliza arquivo disfarçado de imagem.
export async function processImage(
  bytes: Uint8Array,
  preset: ImagePreset,
): Promise<ProcessedImage> {
  await readImageMetadata(bytes);

  const config = IMAGE_PRESETS[preset];
  const sides = [config.maxSide, ...(config.fallbackSides ?? [])];

  for (const maxSide of sides) {
    for (const quality of config.qualities) {
      const image = createImage(bytes)
        .resize(maxSide, maxSide, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality });

      let encoded: Uint8Array;
      try {
        encoded = await image.bytes();
      } catch (error) {
        throw toBadRequest(error);
      }

      if (config.maxBytes === undefined || encoded.byteLength < config.maxBytes) {
        return { bytes: encoded, width: image.width, height: image.height, quality };
      }
    }
  }

  throw new BadRequestError(THUMBNAIL_TOO_LARGE_MESSAGE);
}
