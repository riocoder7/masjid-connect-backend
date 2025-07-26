const express = require('express');
const bodyParser = require('body-parser');
const listenToMasjid = require('./utils/listenMasjid');

const app = express();
app.use(bodyParser.json());

const followedMasjids = new Set();

app.get('/', (req, res) => {
  res.send('Masjid Connect Backend is live');
});

app.post('/follow-masjid', (req, res) => {
    
  const { masjidId } = req.body;

  if (!masjidId) return res.status(400).json({ error: 'masjidId is required' });

  if (!followedMasjids.has(masjidId)) {
    followedMasjids.add(masjidId);
    listenToMasjid(masjidId);
  }

  res.status(200).json({ success: true, message: `Following masjid: ${masjidId}` });
});

module.exports = app;
