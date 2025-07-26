const axios = require('axios');

const sendPush = async (tokens, title, body) => {
  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: { title, body }, // optional: useful if you want to handle notification data in app
  }));

  try {
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100)); // Expo allows max 100 messages per request
    }

    for (const chunk of chunks) {
      const res = await axios.post('https://exp.host/--/api/v2/push/send', chunk, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Push notification response:', res.data);
    }
  } catch (error) {
    console.error('❌ Error sending push notification:', error?.response?.data || error.message);
  }
};

module.exports = sendPush;
