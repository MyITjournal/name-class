import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS db_profiles (
    id                  UUID PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    gender              VARCHAR(20),
    gender_probability  NUMERIC(5, 4),
    sample_size         INTEGER,
    age                 INTEGER,
    age_group           VARCHAR(20),
    age_sample_size     INTEGER,
    country_id          CHAR(2),
    country_probability NUMERIC(5, 4),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS db_profiles_name_unique ON db_profiles (LOWER(name));
  CREATE INDEX IF NOT EXISTS db_profiles_gender_idx     ON db_profiles (gender);
  CREATE INDEX IF NOT EXISTS db_profiles_age_group_idx  ON db_profiles (age_group);
  CREATE INDEX IF NOT EXISTS db_profiles_country_id_idx ON db_profiles (country_id);
`;

export async function initDb() {
  await pool.query(CREATE_TABLE);
}

export default pool;
