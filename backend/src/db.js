const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'cryptobot',
  process.env.DB_USER || 'root',
  process.env.DB_PWD,
  {
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    logging: process.env.DB_LOGS === 'true' ? console.log : false
  });

module.exports = sequelize;