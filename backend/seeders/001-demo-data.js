'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('password123', 12);
    
    await queryInterface.bulkInsert('users', [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'demo@example.com',
        name: 'Demo User',
        password_hash: passwordHash,
        created_at: new Date(),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'admin@example.com',
        name: 'Admin User',
        password_hash: passwordHash,
        created_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('recipients', [
      { id: '33333333-3333-3333-3333-333333333331', email: 'user1@example.com', name: 'User One', created_at: new Date() },
      { id: '33333333-3333-3333-3333-333333333332', email: 'user2@example.com', name: 'User Two', created_at: new Date() },
      { id: '33333333-3333-3333-3333-333333333333', email: 'user3@example.com', name: 'User Three', created_at: new Date() },
      { id: '33333333-3333-3333-3333-333333333334', email: 'user4@example.com', name: 'User Four', created_at: new Date() },
      { id: '33333333-3333-3333-3333-333333333335', email: 'user5@example.com', name: 'User Five', created_at: new Date() },
    ]);

    await queryInterface.bulkInsert('campaigns', [
      {
        id: '44444444-4444-4444-4444-444444444441',
        name: 'Welcome Campaign',
        subject: 'Welcome to our platform!',
        body: 'Hello! Welcome to our platform. We are excited to have you.',
        status: 'sent',
        scheduled_at: null,
        created_by: '11111111-1111-1111-1111-111111111111',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: '44444444-4444-4444-4444-444444444442',
        name: 'Summer Sale',
        subject: 'Summer Sale - 50% Off!',
        body: 'Don\'t miss our summer sale! Get 50% off on all items.',
        status: 'scheduled',
        scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        created_by: '11111111-1111-1111-1111-111111111111',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: '44444444-4444-4444-4444-444444444443',
        name: 'Product Launch',
        subject: 'New Product Launch!',
        body: 'Check out our new product launching next week.',
        status: 'draft',
        scheduled_at: null,
        created_by: '11111111-1111-1111-1111-111111111111',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('campaign_recipients', [
      { campaign_id: '44444444-4444-4444-4444-444444444441', recipient_id: '33333333-3333-3333-3333-333333333331', sent_at: new Date(), opened_at: new Date(), status: 'sent' },
      { campaign_id: '44444444-4444-4444-4444-444444444441', recipient_id: '33333333-3333-3333-3333-333333333332', sent_at: new Date(), opened_at: null, status: 'sent' },
      { campaign_id: '44444444-4444-4444-4444-444444444441', recipient_id: '33333333-3333-3333-3333-333333333333', sent_at: new Date(), opened_at: new Date(), status: 'sent' },
      { campaign_id: '44444444-4444-4444-4444-444444444441', recipient_id: '33333333-3333-3333-3333-333333333334', sent_at: null, opened_at: null, status: 'failed' },
      { campaign_id: '44444444-4444-4444-4444-444444444441', recipient_id: '33333333-3333-3333-3333-333333333335', sent_at: new Date(), opened_at: new Date(), status: 'sent' },
      { campaign_id: '44444444-4444-4444-4444-444444444442', recipient_id: '33333333-3333-3333-3333-333333333331', sent_at: null, opened_at: null, status: 'pending' },
      { campaign_id: '44444444-4444-4444-4444-444444444442', recipient_id: '33333333-3333-3333-3333-333333333332', sent_at: null, opened_at: null, status: 'pending' },
      { campaign_id: '44444444-4444-4444-4444-444444444442', recipient_id: '33333333-3333-3333-3333-333333333333', sent_at: null, opened_at: null, status: 'pending' },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('campaign_recipients', null, {});
    await queryInterface.bulkDelete('campaigns', null, {});
    await queryInterface.bulkDelete('recipients', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
