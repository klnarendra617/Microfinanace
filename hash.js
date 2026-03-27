const bcrypt = require("bcryptjs");

const password = "kranthi"; // your password

bcrypt.hash(password, 10).then(hash => {
  console.log(hash);
});