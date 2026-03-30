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
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      recipient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'recipient_id',
        references: {
          model: 'recipients',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      sent_at: {
        type: Sequelize.DATE WITH TIME ZONE,
        allowNull: true,
        field: 'sent_at',
      },
      opened_at: {
        type: Sequelize.DATE WITH TIME ZONE,
        allowNull: true,
        field: 'opened_at',
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
    });

    await queryInterface.addPrimaryKey('campaign_recipients', ['campaign_id', 'recipient_id']);
    await queryInterface.addIndex('campaign_recipients', ['recipient_id']);
    await queryInterface.addIndex('campaign_recipients', ['status']);
    await queryInterface.addIndex('campaign_recipients', ['sent_at'], {
      where: 'sent_at IS NOT NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('campaign_recipients');
  },
};
