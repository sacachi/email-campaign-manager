'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'password_hash',
      },
      created_at: {
        type: Sequelize.DATE WITH TIME ZONE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
        field: 'created_at',
      },
    });

    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
