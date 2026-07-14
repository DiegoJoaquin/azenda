"use client";

// Procesa el logo que sube el negocio: lo recorta a un cuadrado centrado y lo
// reduce a un tamaño pequeño, guardándolo como data URL. Así no necesitamos
// configurar Supabase Storage: el logo (ligero) viaja en la columna logo_url.

const MAX_SIZE = 256; // px del lado del cuadrado final
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB de archivo original

export async function fileToSquareDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("La imagen no puede superar los 5 MB.");
  }

  const bitmap = await loadImage(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = MAX_SIZE;
  canvas.height = MAX_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");

  // Fondo blanco para logos con transparencia (se ven limpios en el círculo)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, MAX_SIZE, MAX_SIZE);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, MAX_SIZE, MAX_SIZE);

  // JPEG con buena compresión: un logo de 256px queda en ~15–30 KB
  return canvas.toDataURL("image/jpeg", 0.85);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No pudimos leer la imagen."));
    };
    img.src = url;
  });
}
