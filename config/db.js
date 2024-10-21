const mysql = require("mysql2"); // Use mysql2 instead of mysql
const dotenv = require("dotenv").config();
const fs = require('fs');

// Create a MySQL connection for user database
const userDbConfig = mysql.createConnection({
    host: process.env.DB_HOST, // Updated
    user: process.env.DB_USER, // Updated
    password: process.env.DB_PASSWORD, // Updated
    database: process.env.DB_NAME // Updated
});

// Create a MySQL connection for client database
const clientDbConfig = mysql.createConnection({
    host: process.env.DB_HOST, // Updated
    user: process.env.DB_USER, // Updated
    password: process.env.DB_PASSWORD, // Updated
    database: process.env.DB_NAME // Updated
});

// Promisify the query method for easier async/await usage
const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        userDbConfig.query(sql, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

// Export the configurations and the query function
module.exports = {
    userDbConfig,
    clientDbConfig,
    query // Export the query function for use in other modules
};
