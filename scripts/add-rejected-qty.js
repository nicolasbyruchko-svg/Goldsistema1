const { Client } = require('pg');

const c = new Client({
  connectionString: 'postgresql://postgres.pbzsqfjhkbkvxolfqkcn:NicolasByruchko1@aws-0-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await c.connect();
  console.log('Conectado ao banco.');

  await c.query('ALTER TABLE "DevolutionItem" ADD COLUMN IF NOT EXISTS "rejectedQty" INTEGER NOT NULL DEFAULT 0');
  console.log('Coluna rejectedQty adicionada com sucesso!');

  const r = await c.query('SELECT COUNT(*) as count FROM "DevolutionItem"');
  console.log('Total de DevolutionItem:', r.rows[0].count);

  await c.end();
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
