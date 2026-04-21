import User from './User';
import Otp from './Otp';
import Workshop from './Workshop';
import Service from './Service';
import Review from './Review';
import ServiceRequest from './ServiceRequest';
import Quotation from './Quotation';
import Worker from './Worker';

// Define associations
User.hasMany(Otp, {
  foreignKey: 'user_id',
  as: 'otps',
  onDelete: 'CASCADE'
});

Otp.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

// Workshop associations
User.hasMany(Workshop, {
  foreignKey: 'ownerId',
  as: 'workshops',
  onDelete: 'CASCADE'
});

Workshop.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner',
  onDelete: 'CASCADE'
});

// Service associations
Workshop.hasMany(Service, {
  foreignKey: 'workshop_id',
  as: 'services',
  onDelete: 'CASCADE'
});

Service.belongsTo(Workshop, {
  foreignKey: 'workshop_id',
  as: 'workshop',
  onDelete: 'CASCADE'
});

// Review associations
Workshop.hasMany(Review, {
  foreignKey: 'workshop_id',
  as: 'reviews',
  onDelete: 'CASCADE'
});

Review.belongsTo(Workshop, {
  foreignKey: 'workshop_id',
  as: 'workshop',
  onDelete: 'CASCADE'
});

User.hasMany(Review, {
  foreignKey: 'user_id',
  as: 'reviews',
  onDelete: 'CASCADE'
});

Review.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

// Service Request associations
User.hasMany(ServiceRequest, {
  foreignKey: 'user_id',
  as: 'serviceRequests',
  onDelete: 'CASCADE'
});

ServiceRequest.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

Workshop.hasMany(ServiceRequest, {
  foreignKey: 'workshop_id',
  as: 'serviceRequests',
  onDelete: 'SET NULL'
});

ServiceRequest.belongsTo(Workshop, {
  foreignKey: 'workshop_id',
  as: 'workshop',
  onDelete: 'SET NULL'
});

// Worker associations
Workshop.hasMany(Worker, {
  foreignKey: 'workshop_id',
  as: 'workers',
  onDelete: 'CASCADE'
});

Worker.belongsTo(Workshop, {
  foreignKey: 'workshop_id',
  as: 'workshop',
  onDelete: 'CASCADE'
});

User.hasMany(Worker, {
  foreignKey: 'user_id',
  as: 'workerProfiles',
  onDelete: 'CASCADE'
});

Worker.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

// Service Request - Worker assignment
Worker.hasMany(ServiceRequest, {
  foreignKey: 'assigned_worker_id',
  as: 'assignedRequests',
  onDelete: 'SET NULL'
});

ServiceRequest.belongsTo(Worker, {
  foreignKey: 'assigned_worker_id',
  as: 'assignedWorker',
  onDelete: 'SET NULL'
});

// Quotation associations
ServiceRequest.hasMany(Quotation, {
  foreignKey: 'service_request_id',
  as: 'quotations',
  onDelete: 'CASCADE'
});

Quotation.belongsTo(ServiceRequest, {
  foreignKey: 'service_request_id',
  as: 'serviceRequest',
  onDelete: 'CASCADE'
});

Workshop.hasMany(Quotation, {
  foreignKey: 'workshop_id',
  as: 'quotations',
  onDelete: 'CASCADE'
});

Quotation.belongsTo(Workshop, {
  foreignKey: 'workshop_id',
  as: 'workshop',
  onDelete: 'CASCADE'
});

// Export all models
export {
  User,
  Otp,
  Workshop,
  Service,
  Review,
  ServiceRequest,
  Quotation,
  Worker
};
