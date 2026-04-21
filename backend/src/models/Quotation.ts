import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { IQuotation } from '../types';

// Quotation creation attributes (optional id, timestamps)
interface QuotationCreationAttributes extends Optional<IQuotation, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'is_accepted'> {}

class Quotation extends Model<IQuotation, QuotationCreationAttributes> implements IQuotation {
  public id!: string;
  public service_request_id!: string;
  public workshop_id!: string;
  public service_charges!: number;
  public variable_cost!: number;
  public spare_parts_cost!: number;
  public total_amount!: number;
  public notes!: string | null;
  public valid_until!: Date;
  public is_accepted!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Quotation.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  service_request_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'service_requests',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
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
  service_charges: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  variable_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  spare_parts_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfter: new Date().toISOString()
    }
  },
  is_accepted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
  tableName: 'quotations',
  timestamps: true,
  hooks: {
    beforeCreate: (quotation: Quotation) => {
      quotation.total_amount = quotation.service_charges + quotation.variable_cost + quotation.spare_parts_cost;
    },
    beforeUpdate: (quotation: Quotation) => {
      if (quotation.changed('service_charges') || quotation.changed('variable_cost') || quotation.changed('spare_parts_cost')) {
        quotation.total_amount = quotation.service_charges + quotation.variable_cost + quotation.spare_parts_cost;
      }
    }
  },
  indexes: [
    {
      fields: ['service_request_id']
    },
    {
      fields: ['workshop_id']
    },
    {
      fields: ['is_accepted']
    },
    {
      fields: ['valid_until']
    }
  ]
});

export default Quotation;
