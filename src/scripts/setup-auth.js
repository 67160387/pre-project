const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();
if (process.env.AUTH_PASSWORD_HASH) {
  console.log('Account already configured; preserved.');
} else {
  const password = crypto.randomBytes(12).toString('base64url');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  fs.appendFileSync('.env', `\nAUTH_USERNAME=admin\nAUTH_PASSWORD_SALT=${salt}\nAUTH_PASSWORD_HASH=${hash}\n`);
  console.log('Username: admin\nPassword: ' + password + '\nSave this password; only its hash is stored. Restart the app.');
}
