// utils/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('../masjid-connect-d7f67-firebase-adminsdk-fbsvc-08d2af3259.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://masjid-connect-d7f67-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const db = admin.database();
module.exports = db;
