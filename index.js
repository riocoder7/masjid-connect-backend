const admin = require('firebase-admin');
const express = require('express');
const axios = require('axios');
require('dotenv').config();
const serviceAccountJson = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "", "base64").toString("utf8")
);
if (!serviceAccountJson) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set');
}
try {
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountJson),
  databaseURL: process.env.FIREBASE_REALDB_URL,
});
} catch (err) {
  console.error('🔥 Firebase init error:', err);
}

const db = admin.database();
const app = express();
app.use(express.json());

// const PORT = process.env.PORT || 3000;

// 🔐 Keep track of followed masjids (from multiple users)
const followedMasjids = new Set();

app.get('/', (req, res) => res.send('✅ Masjid Connect Backend running...'));

// 📥 API to follow a masjid
app.post('/start-listen', (req, res) => {
  const { masjidId } = req.body;

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

app.post('/api/notifications', (req, res) => {
  console.log(req.body);
  res.send('✅ Notification received');
});

// 🔔 Send push notification
const sendPush = async (tokens, title, body) => {
  for (const token of tokens) {
    try {
      await axios.post(
        'https://exp.host/--/api/v2/push/send',
        {
          to: token,
          sound: 'default',
          title,
          body,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`✅ Push sent to ${token}`);
    } catch (error) {
      console.error('❌ Error sending push:', error.response?.data || error.message);
    }
  }
};

// ✅ SEND PUSH WITH AZAN SOUND
const sendPushAzan = async (tokens, title, body) => {
  for (const token of tokens) {
    const payload = {
      to: token,
      sound: 'azan.mp3',
      channelId: 'azan-channel',
      priority: 'high',
      title,
      body,
      
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log(`✅ Azan Push sent to ${token}:`, result);
    } catch (error) {
      console.error(`❌ Azan Push failed for ${token}:`, error.message);
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
            await sendPushAzan(pushTokens, `Azan: ${item.prayerName}`, item.time);
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
  


  app.listen(process.env.PORT || 3000, () => {
    console.log('✅ Server running on port ' + (process.env.PORT || 3000));
  });



