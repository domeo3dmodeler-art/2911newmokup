const bcrypt = require('bcryptjs');
bcrypt.hash('Test2025!', 12).then(h => console.log(h));
