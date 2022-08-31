const { Client } = require("pg");

const db_url =
  process.env.DATABASE_URL ||
  "postgres://uidkhwvqmqdaxl:2114fa3a41d6e319ac9d7c3a749f6e1f8df4ea661b441885e5990ce7119d9d7b@ec2-54-246-185-161.eu-west-1.compute.amazonaws.com:5432/d37rovpofqgf0b";

const client = new Client({
  connectionString: db_url,
  ssl: {
    rejectUnauthorized: false, // Använd inte i produktion
  },
});

client.connect();

const messagesTable = `
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    message TEXT,
    sender TEXT,
    room TEXT
  )
`;

client.query(messagesTable);

module.exports = client;
