const Airtable = require('airtable');
const Bottleneck = require('bottleneck');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const limiter = new Bottleneck({ minTime: 200, maxConcurrent: 1 });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { action, table, id, data, params } = req.body;
    const validTables = ['Songs', 'Setlists', 'Events'];
    if (!validTables.includes(table)) return res.status(400).json({ error: 'Tabla no válida' });

    const tableRef = base(table);
    let result;

    switch (action) {
      case 'list':
        result = await limiter.schedule(() => tableRef.select(params || {}).all());
        break;
      case 'create':
        if (!data || Object.keys(data).length === 0) return res.status(400).json({ error: 'Datos requeridos' });
        result = await limiter.schedule(() => tableRef.create(data));
        break;
      case 'update':
        if (!id) return res.status(400).json({ error: 'ID requerido' });
        result = await limiter.schedule(() => tableRef.update(id, data));
        break;
      case 'delete':
        if (!id) return res.status(400).json({ error: 'ID requerido' });
        result = await limiter.schedule(() => tableRef.destroy(id));
        break;
      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }
    res.json(result);
  } catch (error) {
    console.error('Proxy error:', error.message);
    if (error.statusCode === 429) return res.status(429).json({ error: 'Rate limit' });
    if (error.statusCode === 404) return res.status(404).json({ error: 'No encontrado' });
    res.status(500).json({ error: 'Error interno' });
  }
};
