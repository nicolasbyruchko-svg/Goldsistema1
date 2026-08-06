/**
 * Cria o usuário Administrador inicial.
 *
 * Uso:
 *   npm run seed:admin -- "Nome do Admin" admin senha123
 *
 * Ou com variáveis de ambiente (opcional): ADMIN_NAME, ADMIN_USERNAME, ADMIN_PASSWORD
 * Valores padrão: nome "Administrador", login "admin", senha "admin123".
 *
 * A senha é armazenada com hash scrypt, compatível com a autenticação do sistema.
 */
import "dotenv/config";
import { randomBytes, scrypt } from "crypto";
import { Client } from "pg";

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    scrypt(password, salt, SCRYPT_PARAMS.keylen, SCRYPT_PARAMS, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt:${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

async function main() {
  const [nameArg, usernameArg, passwordArg] = process.argv.slice(2);

  const name = nameArg || process.env.ADMIN_NAME || "Administrador";
  const username = (usernameArg || process.env.ADMIN_USERNAME || "admin")
    .trim()
    .toLowerCase();
  const password = passwordArg || process.env.ADMIN_PASSWORD || "admin123";

  if (password.length < 6) {
    console.error("Erro: a senha deve ter ao menos 6 caracteres.");
    process.exit(1);
  }

  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await c.connect();
    console.log("Conectado ao banco.");

    const existing = await c.query('SELECT id FROM "User" WHERE "username" = $1', [
      username,
    ]);

    if (existing.rowCount > 0) {
      console.error(
        `Já existe um usuário com o login "${username}".` +
          " Use o módulo Usuários no sistema para gerenciá-lo."
      );
      process.exit(1);
    }

    const passwordHash = await hashPassword(password);
    await c.query(
      'INSERT INTO "User" ("id", "name", "username", "passwordHash", "role", "active", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, true, now(), now())',
      [name, username, passwordHash, "ADMIN"]
    );

    console.log("Admin criado com sucesso!");
    console.log("  Nome:  " + name);
    console.log("  Login: " + username);
    console.log("  Perfil: Administrador");
    console.log("\nAcesse o sistema na tela de login.");
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
