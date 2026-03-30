import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

type CampaignStatus = 'draft' | 'sending' | 'scheduled' | 'sent';

interface CampaignAttributes {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: CampaignStatus;
  scheduled_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface CampaignCreationAttributes extends Optional<CampaignAttributes, 'id' | 'status' | 'scheduled_at' | 'created_at' | 'updated_at'> {}

class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
  declare id: string;
  declare name: string;
  declare subject: string;
  declare body: string;
  declare status: CampaignStatus;
  declare scheduled_at: Date | null;
  declare created_by: string;
  declare created_at: Date;
  declare updated_at: Date;
}

Campaign.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'sending', 'scheduled', 'sent'),
      allowNull: false,
      defaultValue: 'draft',
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_at',
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'Campaign',
    tableName: 'campaigns',
    underscored: true,
    timestamps: false,
  }
);

export default Campaign;
export type { CampaignStatus };
