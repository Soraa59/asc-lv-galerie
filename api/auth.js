export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  let password;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    password = body.password;
  } catch {
    return res.status(400).json({ ok: false });
  }
  
  if (password === process.env.GATE_PWD) {
    return res.status(200).json({ ok: true });
  }
  
  return res.status(401).json({ ok: false });
}
