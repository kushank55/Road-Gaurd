import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { IWorker } from '../types';

// Worker creation attributes (optional id, timestamps)
interface WorkerCreationAttributes extends Optional<IWorker, 'id' | 'createdAt' | 'updatedAt' | 'is_available' | 'current_location_latitude' | 'current_location_longitude'> {}

class Worker extends Model<IWorker, WorkerCreationAttributes> implements IWorker {
  public id!: string;
  public workshop_id!: string;
  public user_id!: string;
  public name!: string;
  public phone!: string;
  public email!: string;
  public specialization!: string[];
  public is_available!: boolean;
  public current_location_latitude!: number | null;
  public current_location_longitude!: number | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Worker.init({
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Worker name is required'
      },
      len: {
        args: [2, 255],
        msg: 'Worker name must be between 2 and 255 characters'
      }
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Phone number is required'
      },
      len: {
        args: [10, 15],
        msg: 'Phone number must be between 10 and 15 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: {
        msg: 'Please provide a valid email address'
      },
      notEmpty: {
        msg: 'Email is required'
      }
    }
  },
  specialization: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  current_location_latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    }
  },
  current_location_longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180
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
  tableName: 'workers',
  timestamps: true,
  indexes: [
    {
      fields: ['workshop_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['is_available']
    },
    {
      fields: ['specialization'],
      using: 'gin'
    },
    {
      fields: ['current_location_latitude', 'current_location_longitude']
    },
    {
      unique: true,
      fields: ['workshop_id', 'user_id']
    }
  ]
});

export default Worker;
