const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { imageBase64 } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `Transcribe esta imagen de canción con acordes sobre letra a formato ChordPro. Devuelve solo JSON: {"chordpro":"...", "key":"...", "bpm":...}`;
    const result = await model.generateContent([prompt, { inlineData: { data: imageBase64, mimeType: 'image/jpeg' }}]);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(422).json({ error: 'No se pudo extraer JSON' });
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
