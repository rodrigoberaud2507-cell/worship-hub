const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { question, song } = req.body;
    if (!question || !song) return res.status(400).json({ error: 'Faltan datos' });
    if (!process.env.GEMINI_API_KEY) return res.status(501).json({ error: 'Gemini no configurado' });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `Eres un asistente musical experto. Responde la siguiente pregunta sobre la canción "${song.title}" de ${song.artist || 'desconocido'}. La letra y acordes en formato ChordPro es:\n${song.chordpro}\n\nPregunta: ${question}\nRespuesta:`;
    const result = await model.generateContent(prompt);
    const answer = result.response.text();
    res.json({ answer });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Error al generar respuesta' });
  }
};
