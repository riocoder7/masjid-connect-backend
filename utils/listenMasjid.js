const db = require('./firebase');
const notifyAllMasjidUsers = require('./notifyAllMasjidUsers');

const listenToMasjid = (masjidId) => {
  console.log(`📡 Listening to masjidId: ${masjidId}`);

  const masjidRef = db.ref(masjidId);
  const seenAzan = new Set();
  const seenAnnouncements = new Set();

  // 🧠 First read: record existing IDs
  masjidRef.once('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const azan = data.azan || {};
    Object.keys(azan).forEach((id) => seenAzan.add(id));

    const announcements = data.announcements || {};
    Object.keys(announcements).forEach((id) => seenAnnouncements.add(id));

    // 🟢 Start real-time updates
    masjidRef.on('value', async (snap) => {
      const newData = snap.val();
      if (!newData) return;

      const pushTokens = Object.values(newData.pushTokens || {});
      if (pushTokens.length === 0) return;

      // 🔔 Azan check
      const newAzan = newData.azan || {};
      for (const [id, item] of Object.entries(newAzan)) {
        if (!seenAzan.has(id)) {
          seenAzan.add(id);
          console.log(`📢 New Azan: ${item.prayerName} - ${item.time}`);
          await notifyAllMasjidUsers(pushTokens, `Azan: ${item.prayerName}`, item.time);
        }
      }

      // 📣 Announcement check
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
