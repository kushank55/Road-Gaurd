import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { IService } from '../types';

// Service creation attributes (optional id, timestamps)
interface ServiceCreationAttributes extends Optional<IService, 'id' | 'createdAt' | 'updatedAt'> {}

class Service extends Model<IService, ServiceCreationAttributes> implements IService {
  public id!: string;
  public workshop_id!: string;
  public name!: string;
  public description!: string;
  public vehicle_model!: string;
  public license_plate!: string;
  public image_urls!: string[];
  public location_address!: string;
  public location_latitude!: number;
  public location_longitude!: number;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Service.init({
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Service name is required'
      }
    }
  },
  description: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Service description is required'
      }
    }
  },
  vehicle_model: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Vehicle model is required'
      }
    }
  },
  license_plate: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'License plate is required'
      }
    }
  },
  image_urls: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  location_address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Service location address is required'
      }
    }
  },
  location_latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      isFloat: {
        msg: 'Latitude must be a valid number'
      },
      min: {
        args: [-90],
        msg: 'Latitude must be between -90 and 90'
      },
      max: {
        args: [90],
        msg: 'Latitude must be between -90 and 90'
      }
    }
  },
  location_longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      isFloat: {
        msg: 'Longitude must be a valid number'
      },
      min: {
        args: [-180],
        msg: 'Longitude must be between -180 and 180'
      },
      max: {
        args: [180],
        msg: 'Longitude must be between -180 and 180'
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
  tableName: 'services',
  timestamps: true,
  indexes: [
    {
      fields: ['workshop_id']
    },
    {
      fields: ['name']
    },
    {
      fields: ['vehicle_model']
    },
    {
      fields: ['license_plate']
    },
    {
      fields: ['location_latitude', 'location_longitude']
    },
    {
      fields: ['location_address']
    }
  ]
});

export default Service;
