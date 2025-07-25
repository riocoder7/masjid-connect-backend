

const express = require('express');
const listenToMasjid = require('../utils/listenMasjid');
const bodyParser = require('body-parser');


const app = express();
const PORT = 3000;

const followedMasjids = new Set();


app.use(bodyParser.json());

app.post('/api/follow', async (req, res) => {
  const { masjidId } = req.body;

  if (!masjidId) {
    return res.status(400).json({ error: 'masjidId is required' });
  }

  if (!followedMasjids.has(masjidId)) {
    followedMasjids.add(masjidId);
    listenToMasjid(masjidId);
    console.log(`🔔 Now listening to masjidId: ${masjidId}`);
  } else {
    console.log(`✅ Already following masjidId: ${masjidId}`);
  }

  return res.status(200).json({ success: true, message: `Following masjid: ${masjidId}` });
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running at http://localhost:${PORT}`);
});
