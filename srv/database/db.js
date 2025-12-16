const Sequelize = require("sequelize");
const fs = require("fs");
const path = require("path");

// Load configuration from config/config.json
const configPath = path.join(__dirname, '..', 'config', 'config.json');
const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const env = process.env.NODE_ENV || 'development';
const config = configFile[env];

const context = new Sequelize(config);

context
  .authenticate()
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log("Error: ", err));

module.exports = config;
module.exports.context = context;
