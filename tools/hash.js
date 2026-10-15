'use strict';
const { hash } = require('../lib/security');
const pw = process.argv[2];
if (!pw || pw.length < 10) {
  console.error('Uso: npm run hash -- "UnaContraseñaDeAlMenos10Caracteres"');
  process.exit(1);
}
console.log(hash(pw));
console.log('\nPegá el resultado en .env como:  ADMIN_USERS=nombre|admin|<hash>');