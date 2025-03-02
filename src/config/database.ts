import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

// Log environment variables to ensure they are loaded
console.log("DB_USER:", process.env.POSTGRES_USER);
console.log("DB_PASSWORD:", process.env.POSTGRES_PASSWORD);
console.log("DB_NAME:", process.env.POSTGRES_DB);
console.log("DB_HOST:", process.env.POSTGRES_HOST);
console.log("DB_PORT:", process.env.POSTGRES_PORT);

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD, // Use the environment variable for the password
  database: process.env.POSTGRES_DB,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
});

// Create tables if they don't exist
const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Drop existing tables in correct order
    // await client.query(`
    //   DROP TABLE IF EXISTS bill_items CASCADE;
    //   DROP TABLE IF EXISTS bills CASCADE;
    //   DROP TABLE IF EXISTS stocks CASCADE;
    //   DROP TABLE IF EXISTS drugs CASCADE;
    // `);

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS drugs (
        drug_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        detail TEXT,
        usage TEXT,
        slang_food TEXT,
        side_effect TEXT,
        drug_type VARCHAR(50) NOT NULL,
        unit_type VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sold_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS stocks (
        stock_id SERIAL PRIMARY KEY,
        drug_id INTEGER REFERENCES drugs(drug_id),
        amount INTEGER NOT NULL,
        expired DATE NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bills (
        bill_id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100) NULL,
        discount DECIMAL(5,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bill_items (
        bill_item_id SERIAL PRIMARY KEY,
        bill_id INTEGER REFERENCES bills(bill_id),
        stock_id INTEGER REFERENCES stocks(stock_id),
        quantity INTEGER NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        service VARCHAR(255) DEFAULT NULL, 
        status VARCHAR(50) DEFAULT 'pending', 
        custom_price DECIMAL(10,2) DEFAULT 0,  
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expense (
        id SERIAL PRIMARY KEY,
        datetime TIMESTAMP NOT NULL,
        orderid INTEGER NOT NULL, -- Add this
        quantity INTEGER NOT NULL,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        totalprice NUMERIC NOT NULL
      );
    `);
    await client.query("COMMIT");
    console.log("✅ Tables recreated successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error recreating tables:", error);
  } finally {
    client.release();
  }
};

pool
  .connect()
  .then(() => {
    console.log("✅ Connected to DB");
    return createTables();
  })
  .catch((err) => {
    console.error("❌ Error connecting to DB:", err);
  });

export default pool;
