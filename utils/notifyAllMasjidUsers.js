const db = require('./firebase');
const sendPush = require('./sendPush');

const notifyAllMasjidUsers = async (masjidId, title, message) => {
  try {
    const pushTokenSnap = await db.ref(`${masjidId}/pushTokens`).once('value');
    const tokenObj = pushTokenSnap.val();

    if (!tokenObj) {
      console.warn(`⚠️ No tokens found for masjidId: ${masjidId}`);
      return;
    }

    const tokens = Object.values(tokenObj);
    console.log(`📨 Sending message to ${tokens.length} tokens...`);
    
    await sendPush(tokens, title, message);
  } catch (err) {
    console.error('❌ Error sending to all tokens:', err.message);
  }
};

module.exports = notifyAllMasjidUsers;
