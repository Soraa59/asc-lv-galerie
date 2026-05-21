export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const CLOUD = process.env.CLOUDINARY_CLOUD;
  const PRESET = process.env.CLOUDINARY_PRESET;

  const { file, name, cat } = req.body;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET);
  fd.append('folder', 'asc-galerie');

  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: fd
  });

  const data = await r.json();
  
  if (!r.ok) {
    return res.status(400).json({ error: data });
  }

  const url = data.secure_url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
  return res.status(200).json({ id: data.public_id, url, name, cat, date: Date.now() });
}
