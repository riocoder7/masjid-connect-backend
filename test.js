const admin = require('firebase-admin');
const axios = require('axios');
const express = require('express');
const serviceAccount = require('./org/masjid-connect-final.json');
const masjidId = req.body?.masjidId;
 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://masjid-connect-2acb6-default-rtdb.asia-southeast1.firebasedatabase.app/'
});

const db = admin.database();
const app = express();
app.use(express.json());

const PORT = 3000;

// 🔐 Keep track of followed masjids (from multiple users)
const followedMasjids = new Set();

app.get('/', (req, res) => res.send('✅ Backend is alive'));

// 📥 API to follow a masjid
app.post('/api/follow', (req, res) => {
  const masjidId = req.body?.masjidId;

  if (!masjidId) {
    return res.status(400).json({ error: 'masjidId is required' });
  }

  if (!followedMasjids.has(masjidId)) {
    followedMasjids.add(masjidId);
    listenToMasjid(masjidId); // ⏳ Setup listener
    console.log(`👂 Listening for masjid: ${masjidId}`);
  }

  res.status(200).json({ success: true, message: `Following masjidId: ${masjidId}` });
});

// 🔔 Send push notification
const sendPush = async (tokens, title, body) => {
  for (const token of tokens) {
    try {
      await axios.post('https://exp.host/--/api/v2/push/send', {
        to: token,
        sound: 'default',
        title,
        body,
      });
    } catch (error) {
      console.error('❌ Error sending push:', error.message);
    }
  }
};

// 👂 Setup Firebase listener for azan and announcements
const listenToMasjid = (masjidId) => {
    const masjidRef = db.ref(masjidId);
    const seenAzan = new Set();
    const seenAnnouncements = new Set();
  
    // 🔍 Initial snapshot to store existing IDs
    masjidRef.once('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
  
      const azan = data.azan || {};
      for (const id of Object.keys(azan)) {
        seenAzan.add(id);
      }
  
      const announcements = data.announcements || {};
      for (const id of Object.keys(announcements)) {
        seenAnnouncements.add(id);
      }
  
      // ✅ Start real-time listener *after* storing previous IDs
      masjidRef.on('value', async (snap) => {
        const newData = snap.val();
        if (!newData) return;
  
        const pushTokens = Object.values(newData.pushTokens || {});
  
        // Check new Azan
        const newAzan = newData.azan || {};
        for (const [id, item] of Object.entries(newAzan)) {
          if (!seenAzan.has(id)) {
            seenAzan.add(id);
            console.log(`📢 New Azan: ${item.prayerName} - ${item.time}`);
            await sendPush(pushTokens, `Azan: ${item.prayerName}`, item.time);
          }
        }
  
        // Check new Announcements
        const newAnnouncements = newData.announcements || {};
        for (const [id, item] of Object.entries(newAnnouncements)) {
          if (!seenAnnouncements.has(id)) {
            seenAnnouncements.add(id);
            console.log(`📢 New Announcement: ${item.title}`);
            await sendPush(pushTokens, item.title, item.message);
          }
        }
      });
    });
  };
  



app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


