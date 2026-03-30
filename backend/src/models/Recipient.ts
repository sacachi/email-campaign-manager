import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

interface RecipientAttributes {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

interface RecipientCreationAttributes extends Optional<RecipientAttributes, 'id' | 'created_at'> {}

class Recipient extends Model<RecipientAttributes, RecipientCreationAttributes> implements RecipientAttributes {
  declare id: string;
  declare email: string;
  declare name: string;
  declare created_at: Date;
}

Recipient.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    modelName: 'Recipient',
    tableName: 'recipients',
    underscored: true,
    timestamps: false,
  }
);

export default Recipient;
