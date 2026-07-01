const bcrypt = require('bcryptjs');
const password = 'CubA_utos2026*'; // cámbiala
const hash = bcrypt.hashSync(password, 12);
console.log(hash);