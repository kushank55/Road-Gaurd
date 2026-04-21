import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { IServiceRequest, ServiceRequestStatus, ServiceRequestPriority, ServiceRequestType } from '../types';

// Service Request creation attributes (optional id, timestamps)
interface ServiceRequestCreationAttributes extends Optional<IServiceRequest, 'id' | 'createdAt' | 'updatedAt' | 'workshop_id' | 'assigned_worker_id' | 'estimated_completion' | 'actual_completion'> {}

class ServiceRequest extends Model<IServiceRequest, ServiceRequestCreationAttributes> implements IServiceRequest {
  public id!: string;
  public user_id!: string;
  public workshop_id!: string | null;
  public name!: string;
  public description!: string;
  public service_type!: ServiceRequestType;
  public priority!: ServiceRequestPriority;
  public status!: ServiceRequestStatus;
  public location_address!: string;
  public location_latitude!: number;
  public location_longitude!: number;
  public scheduled_start_time!: Date | null;
  public scheduled_end_time!: Date | null;
  public issue_description!: string;
  public image_urls!: string[];
  public assigned_worker_id!: string | null;
  public estimated_completion!: Date | null;
  public actual_completion!: Date | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ServiceRequest.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
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
  workshop_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'workshops',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Service request name is required'
      },
      len: {
        args: [2, 255],
        msg: 'Service request name must be between 2 and 255 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Service request description is required'
      },
      len: {
        args: [10, 1000],
        msg: 'Service request description must be between 10 and 1000 characters'
      }
    }
  },
  service_type: {
    type: DataTypes.ENUM(...Object.values(ServiceRequestType)),
    allowNull: false,
    defaultValue: ServiceRequestType.INSTANT_SERVICE
  },
  priority: {
    type: DataTypes.ENUM(...Object.values(ServiceRequestPriority)),
    allowNull: false,
    defaultValue: ServiceRequestPriority.MEDIUM
  },
  status: {
    type: DataTypes.ENUM(...Object.values(ServiceRequestStatus)),
    allowNull: false,
    defaultValue: ServiceRequestStatus.PENDING
  },
  location_address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Location address is required'
      },
      len: {
        args: [5, 500],
        msg: 'Location address must be between 5 and 500 characters'
      }
    }
  },
  location_latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90
    }
  },
  location_longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180
    }
  },
  scheduled_start_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  scheduled_end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  issue_description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Issue description is required'
      },
      len: {
        args: [10, 2000],
        msg: 'Issue description must be between 10 and 2000 characters'
      }
    }
  },
  image_urls: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  assigned_worker_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'workers',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  estimated_completion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actual_completion: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'service_requests',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['workshop_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['service_type']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['assigned_worker_id']
    },
    {
      fields: ['scheduled_start_time']
    },
    {
      fields: ['location_latitude', 'location_longitude']
    }
  ]
});

export default ServiceRequest;
