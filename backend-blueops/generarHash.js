const bcrypt = require("bcrypt");

const generarHash = async () => {
  const passwordEnTextoPlano = "257925251986"; // Aquí pones DNI + año nacimiento
  const hash = await bcrypt.hash(passwordEnTextoPlano, 10);
  console.log("HASH:", hash);
};

generarHash();