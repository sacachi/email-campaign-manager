'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recipients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
        field: 'created_at'
      }
    });

    await queryInterface.addIndex('recipients', ['email'], { unique: true });
    await queryInterface.addIndex('recipients', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('recipients');
  }
};
