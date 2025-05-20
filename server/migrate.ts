import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

// This script sets up the database tables
async function main() {
  console.log('Setting up database...');
  
  // Create a PostgreSQL connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Create a Drizzle ORM instance
    const db = drizzle(pool, { schema });
    
    // Push the schema to the database (create tables)
    console.log('Creating database tables...');
    await migrate(db, { migrationsFolder: 'drizzle' });
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the migration
main();