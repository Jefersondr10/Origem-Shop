import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import {stdin as input, stdout as output} from "node:process";

const rl = readline.createInterface({input, output});
const password = await rl.question("Senha administrativa: ");
rl.close();

if (password.length < 10) {
  console.error("Use uma senha com pelo menos 10 caracteres.");
  process.exit(1);
}

console.log(await bcrypt.hash(password, 12));
