"use strict";

/** Database for lunchly */

const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

// const DB_URI = process.env.NODE_ENV === "test"
//     ? "postgresql:///lunchly_test"
//     : "postgresql:///lunchly";

const db = new Client({
  connectionString: getDatabaseUri(),
});

db.connect();

module.exports = db;