const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);
