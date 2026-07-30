import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL:', databaseUrl ? 'Defined' : 'NOT Defined');
if (databaseUrl) {
  console.log('DATABASE_URL snippet:', databaseUrl.slice(0, 30) + '...');
}

async function testConnection() {
  if (!databaseUrl) {
    console.error('No DATABASE_URL found in environment variables.');
    return;
  }
  try {
    console.log('Connecting to database...');
    const sql = postgres(databaseUrl);
    console.log('Running simple query SELECT 1...');
    const result = await sql`SELECT 1 as connected`;
    console.log('Result:', result);
    
    console.log('Running query to check if repositories table exists...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables in public schema:', tables.map(t => t.table_name));
    
    await sql.end();
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

testConnection();
