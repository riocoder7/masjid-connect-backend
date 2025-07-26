// utils/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('../org/masjid-connect-final.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://masjid-connect-2acb6-default-rtdb.asia-southeast1.firebasedatabase.app/'
  });
}

const db = admin.database();
module.exports = db;
