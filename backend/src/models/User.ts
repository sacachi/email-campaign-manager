import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

interface UserAttributes {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare name: string;
  declare password_hash: string;
  declare created_at: Date;
}

User.init(
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
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
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
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: false,
  }
);

export default User;
