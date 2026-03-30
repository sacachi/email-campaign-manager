import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

type CampaignRecipientStatus = 'pending' | 'sent' | 'failed';

interface CampaignRecipientAttributes {
  campaign_id: string;
  recipient_id: string;
  sent_at: Date | null;
  opened_at: Date | null;
  status: CampaignRecipientStatus;
}

interface CampaignRecipientCreationAttributes extends Optional<CampaignRecipientAttributes, 'sent_at' | 'opened_at' | 'status'> {}

class CampaignRecipient extends Model<CampaignRecipientAttributes, CampaignRecipientCreationAttributes> implements CampaignRecipientAttributes {
  declare campaign_id: string;
  declare recipient_id: string;
  declare sent_at: Date | null;
  declare opened_at: Date | null;
  declare status: CampaignRecipientStatus;
}

CampaignRecipient.init(
  {
    campaign_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'campaign_id',
      primaryKey: true,
    },
    recipient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'recipient_id',
      primaryKey: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at',
    },
    opened_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'opened_at',
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    modelName: 'CampaignRecipient',
    tableName: 'campaign_recipients',
    underscored: true,
    timestamps: false,
  }
);

export default CampaignRecipient;
export type { CampaignRecipientStatus };
