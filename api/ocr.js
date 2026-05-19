export async function processImageForOCR(file) {
  // Preprocesar imagen para reducir tamaño
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = await createImageBitmap(file);
  
  const maxDim = 1024;
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  
  // Convertir a base64
  const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

  // Llamar a la API de OCR
  const res = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64 })
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al procesar la imagen');
  }
  
  return res.json();
}
