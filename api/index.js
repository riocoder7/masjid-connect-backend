
const listenToMasjid = require('../utils/listenMasjid');
const followedMasjids = new Set();


export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
  
    const { masjidId } = req.body;
    if (!masjidId) return res.status(400).json({ error: 'masjidId is required' });
  
    if (!followedMasjids.has(masjidId)) {
      followedMasjids.add(masjidId);
      listenToMasjid(masjidId);
    }
  
    res.status(200).json({ success: true, message: `Following masjid: ${masjidId}` });
  }



