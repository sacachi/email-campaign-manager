'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recipients', {
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
      created_at: {
        type: Sequelize.DATE WITH TIME ZONE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
        field: 'created_at',
      },
    });

    await queryInterface.addIndex('recipients', ['email'], { unique: true });
    await queryInterface.addIndex('recipients', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('recipients');
  },
};
