export default async function handler(req, res) {
  // Vérification clé secrète cron
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const BIN_ID = process.env.BIN_ID;
  const BIN_KEY = process.env.BIN_KEY;
  const CLOUD = process.env.CLOUDINARY_CLOUD;
  const API_KEY = process.env.CLOUDINARY_API_KEY;
  const API_SECRET = process.env.CLOUDINARY_API_SECRET;

  // Charger les images
  const r = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': BIN_KEY, 'X-Bin-Meta': false }
  });
  const data = await r.json();
  const db = Array.isArray(data) ? data : [];

  const now = Date.now();
  const toDelete = db.filter(x => x.date && (now - x.date) > 30 * 24 * 60 * 60 * 1000);
  const toKeep = db.filter(x => !x.date || (now - x.date) <= 30 * 24 * 60 * 60 * 1000);

  // Supprimer sur Cloudinary
  for (const img of toDelete) {
    try {
      const ts = Math.round(Date.now() / 1000);
      const str = `public_id=${img.id}&timestamp=${ts}${API_SECRET}`;
      const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
      const sig = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      const fd = new FormData();
      fd.append('public_id', img.id);
      fd.append('api_key', API_KEY);
      fd.append('timestamp', ts);
      fd.append('signature', sig);
      await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`, { method: 'POST', body: fd });
    } catch (e) {
      console.error('Cloudinary delete error:', e);
    }
  }

  // Sauvegarder JSONBin sans les images supprimées
  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': BIN_KEY },
    body: JSON.stringify(toKeep)
  });

  return res.status(200).json({ deleted: toDelete.length, kept: toKeep.length });
}
