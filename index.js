// index.js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Masjid Connect Backend is live');
});

app.get('/api/test', (req, res) => {
  res.json({ message: '✅ Test endpoint working' });
});

module.exports = app;
