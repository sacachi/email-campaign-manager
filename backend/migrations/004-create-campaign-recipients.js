'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('campaign_recipients', {
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'campaign_id',
        references: {
          model: 'campaigns',
          key: 'id'
        },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      recipient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'recipient_id',
        references: {
          model: 'recipients',
          key: 'id'
        },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'sent_at'
      },
      opened_at: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'opened_at'
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('campaign_recipients');
  }
};
