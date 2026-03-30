'use strict';

const base = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'campaign_manager',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dialect: 'postgres',
  logging: false,
  seederStorage: 'sequelize',
  seederStorageTableName: 'SequelizeSeederMeta',
};

module.exports = {
  development: { ...base },
  test: {
    ...base,
    database: process.env.DB_NAME_TEST || 'campaign_manager_test',
  },
  production: {
    ...base,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  },
};
