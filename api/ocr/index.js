const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Imagen requerida' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'API key de Gemini no configurada' });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `Eres un experto en transcripción musical. Analiza esta imagen de canción con acordes sobre la letra. Devuelve solo JSON: {"chordpro":"...", "key":"...", "bpm":...}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(422).json({ error: 'No se pudo extraer JSON' });
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error('OCR error:', error.message);
    res.status(500).json({ error: 'Error al procesar imagen' });
  }
};
