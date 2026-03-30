'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('campaigns', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'sending', 'scheduled', 'sent'),
        allowNull: false,
        defaultValue: 'draft'
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'scheduled_at'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'created_by',
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
        field: 'created_at'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
        field: 'updated_at'
      }
    });

    await queryInterface.addIndex('campaigns', ['status']);
    await queryInterface.addIndex('campaigns', ['created_by']);
    await queryInterface.addIndex('campaigns', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('campaigns');
  }
};
