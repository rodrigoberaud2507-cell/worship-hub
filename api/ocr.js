const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'Imagen requerida' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key de Gemini no configurada' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `Eres un experto en transcripción musical cristiana. Analiza esta imagen de una canción con acordes sobre la letra.

Devuelve ÚNICAMENTE un JSON válido (sin markdown, sin explicaciones) con este formato exacto:
{
  "chordpro": "[G]Letra de ejemplo\\n[D]Segunda línea\\n[C]Tercera línea",
  "key": "G",
  "bpm": 120,
  "sections": [{"type": "verso", "start": 0, "end": 2}],
  "confidence": 0.95
}

Reglas:
- chordpro debe tener formato [Acorde]Letra con saltos de línea \\n
- key en formato americano (C, Dm, Eb, F#, etc.)
- bpm aproximado (número entero)
- sections es un array con las secciones detectadas (intro, verso, coro, puente, outro)
- confidence es un número entre 0 y 1`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }
    ]);
    
    const text = result.response.text();
    
    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(422).json({ 
        error: 'No se pudo extraer JSON de la respuesta', 
        rawResponse: text 
      });
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validar campos requeridos
    if (!parsed.chordpro) {
      return res.status(422).json({ error: 'No se detectó letra en la imagen' });
    }
    
    res.json(parsed);
  } catch (error) {
    console.error('Error en OCR:', error.message);
    res.status(500).json({ error: 'Error al procesar la imagen: ' + error.message });
  }
};
