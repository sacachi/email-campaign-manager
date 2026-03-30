import sequelize from '../database/connection';
import User from './User';
import Campaign from './Campaign';
import Recipient from './Recipient';
import CampaignRecipient from './CampaignRecipient';

User.hasMany(Campaign, {
  foreignKey: 'created_by',
  as: 'campaigns',
  onDelete: 'CASCADE',
});

Campaign.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
  onDelete: 'CASCADE',
});

Campaign.belongsToMany(Recipient, {
  through: CampaignRecipient,
  foreignKey: 'campaign_id',
  as: 'recipients',
  onDelete: 'CASCADE',
});

Recipient.belongsToMany(Campaign, {
  through: CampaignRecipient,
  foreignKey: 'recipient_id',
  as: 'campaigns',
  onDelete: 'CASCADE',
});

Campaign.hasMany(CampaignRecipient, {
  foreignKey: 'campaign_id',
  as: 'campaignRecipients',
  onDelete: 'CASCADE',
});

Recipient.hasMany(CampaignRecipient, {
  foreignKey: 'recipient_id',
  as: 'recipientCampaigns',
  onDelete: 'CASCADE',
});

CampaignRecipient.belongsTo(Campaign, {
  foreignKey: 'campaign_id',
  as: 'campaign',
  onDelete: 'CASCADE',
});

CampaignRecipient.belongsTo(Recipient, {
  foreignKey: 'recipient_id',
  as: 'recipient',
  onDelete: 'CASCADE',
});

export {
  sequelize,
  User,
  Campaign,
  Recipient,
  CampaignRecipient,
};

export default {
  sequelize,
  User,
  Campaign,
  Recipient,
  CampaignRecipient,
};
