var crypto = require('crypto');

var hash = crypto.createHash('sha256');

var code = 'bacon';

code = hash.update(code);
code = hash.digest(code);

console.log(code);
