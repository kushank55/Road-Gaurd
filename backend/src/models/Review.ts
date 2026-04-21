import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { IReview } from '../types';

// Review creation attributes (optional id, timestamps)
interface ReviewCreationAttributes extends Optional<IReview, 'id' | 'createdAt' | 'updatedAt'> {}

class Review extends Model<IReview, ReviewCreationAttributes> implements IReview {
  public id!: string;
  public workshop_id!: string;
  public user_id!: string;
  public rating!: number;
  public comment!: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Review.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  workshop_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'workshops',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Rating must be between 1 and 5'
      },
      max: {
        args: [5],
        msg: 'Rating must be between 1 and 5'
      },
      isInt: {
        msg: 'Rating must be an integer'
      }
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Review comment is required'
      },
      len: {
        args: [5, 1000],
        msg: 'Review comment must be between 5 and 1000 characters'
      }
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  tableName: 'reviews',
  timestamps: true,
  indexes: [
    {
      fields: ['workshop_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['rating']
    },
    {
      fields: ['createdAt']
    },
    {
      unique: true,
      fields: ['workshop_id', 'user_id'],
      name: 'unique_workshop_user_review'
    }
  ]
});

export default Review;
