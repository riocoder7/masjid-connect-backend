const db = require('./firebase');
const sendPush = require('./sendPush');


const listenToMasjid = (masjidId) => {
    console.log(`Listening to masjidId: ${masjidId}`);
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

  module.exports = listenToMasjid;