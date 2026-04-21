import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { IWorkshop } from '../types';

// Workshop creation attributes (optional id, timestamps)
interface WorkshopCreationAttributes extends Optional<IWorkshop, 'id' | 'createdAt' | 'updatedAt' | 'image_url' | 'status' | 'rating'> {}

class Workshop extends Model<IWorkshop, WorkshopCreationAttributes> implements IWorkshop {
  public id!: string;
  public name!: string;
  public description!: string;
  public address!: string;
  public latitude!: number;
  public longitude!: number;
  public image_url!: string | null;
  public status!: 'OPEN' | 'CLOSED';
  public rating!: number;
  public ownerId!: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Static method to calculate distance using Haversine formula
  public static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

Workshop.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Workshop name is required'
      },
      len: {
        args: [2, 255],
        msg: 'Workshop name must be between 2 and 255 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Workshop description is required'
      },
      len: {
        args: [10, 2000],
        msg: 'Workshop description must be between 10 and 2000 characters'
      }
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Workshop address is required'
      }
    }
  },
  latitude: {
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
  longitude: {
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
  image_url: {
    type: DataTypes.TEXT,  // Changed from STRING to TEXT to allow longer URLs
    allowNull: true,
    validate: {
      isValidImageUrl(value: string | null) {
        if (value !== null && value !== undefined && value !== '') {
          try {
            const url = new URL(value);
            if (!['http:', 'https:'].includes(url.protocol)) {
              throw new Error('Image URL must use HTTP or HTTPS protocol');
            }
          } catch (error) {
            throw new Error('Image URL must be a valid URL');
          }
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'CLOSED'),
    allowNull: false,
    defaultValue: 'OPEN'
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Rating must be between 0 and 5'
      },
      max: {
        args: [5],
        msg: 'Rating must be between 0 and 5'
      }
    }
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
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
  tableName: 'workshops',
  timestamps: true,
  indexes: [
    {
      fields: ['ownerId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['rating']
    },
    {
      fields: ['latitude', 'longitude']
    },
    {
      fields: ['name']
    }
  ]
});

export default Workshop;
