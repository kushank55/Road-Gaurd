import { Request, Response } from 'express';
import { Op } from 'sequelize';
import ServiceRequest from '../models/ServiceRequest';
import Workshop from '../models/Workshop';
import Worker from '../models/Worker';
import User from '../models/User';
import Quotation from '../models/Quotation';
import Service from '../models/Service';
import { 
  ICreateServiceRequest, 
  IUpdateServiceRequest, 
  IServiceRequestFilters,
  ServiceRequestStatus, 
  ServiceRequestType,
  ServiceRequestPriority,
  IAuthenticatedRequest,
  IApiResponse,
  UserRole
} from '../types';

class ServiceRequestController {
  // Create a new service request
  static async createServiceRequest(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      const serviceRequestData: ICreateServiceRequest = req.body;

      // Validate required fields
      const requiredFields = ['name', 'description', 'location_address', 'location_latitude', 'location_longitude', 'issue_description'];
      const missingFields = requiredFields.filter(field => !serviceRequestData[field as keyof ICreateServiceRequest]);
      
      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        } as IApiResponse);
        return;
      }

      // Validate workshop_id if provided
      if (serviceRequestData.workshop_id) {
        const workshop = await Workshop.findByPk(serviceRequestData.workshop_id);
        if (!workshop) {
          res.status(400).json({
            success: false,
            message: 'Invalid workshop ID provided'
          } as IApiResponse);
          return;
        }
        console.log('Workshop validation passed:', {
          workshop_id: serviceRequestData.workshop_id,
          workshop_name: workshop.name
        });
      } else {
        console.log('No workshop_id provided - creating unassigned service request');
      }

      console.log('Creating service request with data:', {
        user_id: userId,
        workshop_id: serviceRequestData.workshop_id || null,
        name: serviceRequestData.name,
        service_type: serviceRequestData.service_type
      });

      // Create service request
      const serviceRequest = await ServiceRequest.create({
        user_id: userId,
        workshop_id: serviceRequestData.workshop_id || null,
        name: serviceRequestData.name,
        description: serviceRequestData.description,
        service_type: serviceRequestData.service_type || ServiceRequestType.INSTANT_SERVICE,
        priority: serviceRequestData.priority || ServiceRequestPriority.MEDIUM,
        status: ServiceRequestStatus.PENDING,
        location_address: serviceRequestData.location_address,
        location_latitude: serviceRequestData.location_latitude,
        location_longitude: serviceRequestData.location_longitude,
        scheduled_start_time: serviceRequestData.scheduled_start_time || null,
        scheduled_end_time: serviceRequestData.scheduled_end_time || null,
        issue_description: serviceRequestData.issue_description,
        image_urls: serviceRequestData.image_urls || [],
        assigned_worker_id: null,
        estimated_completion: null,
        actual_completion: null
      });

      console.log('Service request created successfully:', {
        id: serviceRequest.id,
        workshop_id: serviceRequest.workshop_id,
        user_id: serviceRequest.user_id,
        status: serviceRequest.status
      });

      // Fetch the created service request with associations
      const createdServiceRequest = await ServiceRequest.findByPk(serviceRequest.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address'] },
          { model: Worker, as: 'assignedWorker', attributes: ['id', 'name', 'phone'] }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Service request created successfully',
        data: createdServiceRequest
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error creating service request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create service request',
        error: error.message
      } as IApiResponse);
    }
  }

  // Get all service requests with filtering
  static async getServiceRequests(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      const filters: IServiceRequestFilters = req.query as any;
      const page = parseInt(filters.page as any) || 1;
      const limit = parseInt(filters.limit as any) || 10;
      const offset = (page - 1) * limit;

      // Build where condition based on user role
      let whereCondition: any = {};

      // Users can only see their own service requests
      if (userRole === UserRole.USER) {
        whereCondition.user_id = userId;
      }
      // Workshop owners can see requests assigned to their workshops
      else if (userRole === UserRole.MECHANIC_OWNER || userRole === UserRole.MECHANIC_EMPLOYEE) {
        // Find workshops owned by this user
        const workshops = await Workshop.findAll({ 
          where: { ownerId: userId },
          attributes: ['id']
        });
        const workshopIds = workshops.map(w => w.id);
        
        if (workshopIds.length > 0) {
          whereCondition.workshop_id = { [Op.in]: workshopIds };
        } else {
          // If no workshops, return empty result
          whereCondition.workshop_id = null;
        }
      }

      // Apply additional filters
      if (filters.status) {
        whereCondition.status = filters.status;
      }
      if (filters.service_type) {
        whereCondition.service_type = filters.service_type;
      }
      if (filters.priority) {
        whereCondition.priority = filters.priority;
      }
      if (filters.workshop_id) {
        whereCondition.workshop_id = filters.workshop_id;
      }
      if (filters.assigned_worker_id) {
        whereCondition.assigned_worker_id = filters.assigned_worker_id;
      }
      if (filters.start_date || filters.end_date) {
        whereCondition.createdAt = {};
        if (filters.start_date) {
          whereCondition.createdAt[Op.gte] = filters.start_date;
        }
        if (filters.end_date) {
          whereCondition.createdAt[Op.lte] = filters.end_date;
        }
      }

      const { count, rows: serviceRequests } = await ServiceRequest.findAndCountAll({
        where: whereCondition,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address', 'latitude', 'longitude'] },
          { model: Worker, as: 'assignedWorker', attributes: ['id', 'name', 'phone', 'specialization'] },
          { 
            model: Quotation, 
            as: 'quotations',
            include: [
              { model: Workshop, as: 'workshop', attributes: ['id', 'name'] }
            ]
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        message: 'Service requests retrieved successfully',
        data: {
          serviceRequests,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: count,
            itemsPerPage: limit
          }
        }
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error getting service requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get service requests',
        error: error.message
      } as IApiResponse);
    }
  }

  // Get single service request by ID
  static async getServiceRequestById(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      const serviceRequest = await ServiceRequest.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address', 'latitude', 'longitude'] },
          { model: Worker, as: 'assignedWorker', attributes: ['id', 'name', 'phone', 'specialization'] },
          { 
            model: Quotation, 
            as: 'quotations',
            include: [
              { model: Workshop, as: 'workshop', attributes: ['id', 'name'] }
            ]
          }
        ]
      });

      if (!serviceRequest) {
        res.status(404).json({
          success: false,
          message: 'Service request not found'
        } as IApiResponse);
        return;
      }

      // Check authorization
      const canAccess = (
        userRole === UserRole.ADMIN ||
        serviceRequest.user_id === userId ||
        (serviceRequest.workshop_id && await this.userOwnsWorkshop(userId, serviceRequest.workshop_id))
      );

      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        } as IApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Service request retrieved successfully',
        data: serviceRequest
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error getting service request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get service request',
        error: error.message
      } as IApiResponse);
    }
  }

  // Update service request status (for workshop owners/employees)
  static async updateServiceRequest(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: IUpdateServiceRequest = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      const serviceRequest = await ServiceRequest.findByPk(id);
      if (!serviceRequest) {
        res.status(404).json({
          success: false,
          message: 'Service request not found'
        } as IApiResponse);
        return;
      }

      // Check if user can update this service request
      const canUpdate = (
        userRole === UserRole.ADMIN ||
        (userRole === UserRole.USER && serviceRequest.user_id === userId) ||
        (serviceRequest.workshop_id && await this.userOwnsWorkshop(userId, serviceRequest.workshop_id))
      );

      if (!canUpdate) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        } as IApiResponse);
        return;
      }

      // Update the service request
      const previousStatus = serviceRequest.status;
      await serviceRequest.update(updateData);

      // Update worker availability based on status changes
      if (updateData.status && serviceRequest.assigned_worker_id) {
        const assignedWorker = await Worker.findByPk(serviceRequest.assigned_worker_id);
        if (assignedWorker) {
          // Make worker available when service is completed or cancelled
          if (updateData.status === 'COMPLETED' || updateData.status === 'CANCELLED') {
            await assignedWorker.update({ is_available: true });
          }
          // Make worker unavailable when service is in progress or accepted
          else if (updateData.status === 'IN_PROGRESS' || updateData.status === 'ACCEPTED') {
            await assignedWorker.update({ is_available: false });
          }
        }
      }

      // Fetch updated service request with associations
      const updatedServiceRequest = await ServiceRequest.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address'] },
          { model: Worker, as: 'assignedWorker', attributes: ['id', 'name', 'phone'] }
        ]
      });

      res.json({
        success: true,
        message: 'Service request updated successfully',
        data: updatedServiceRequest
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error updating service request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update service request',
        error: error.message
      } as IApiResponse);
    }
  }

  // Assign workshop to service request
  static async assignWorkshop(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { workshop_id, assigned_worker_id } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      // Only workshop owners/employees can assign their workshops
      if (userRole !== UserRole.MECHANIC_OWNER && userRole !== UserRole.MECHANIC_EMPLOYEE && userRole !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only workshop owners can assign workshops'
        } as IApiResponse);
        return;
      }

      const serviceRequest = await ServiceRequest.findByPk(id);
      if (!serviceRequest) {
        res.status(404).json({
          success: false,
          message: 'Service request not found'
        } as IApiResponse);
        return;
      }

      // Verify workshop exists and user has access
      const workshop = await Workshop.findByPk(workshop_id);
      if (!workshop) {
        res.status(404).json({
          success: false,
          message: 'Workshop not found'
        } as IApiResponse);
        return;
      }

      if (userRole !== UserRole.ADMIN && workshop.ownerId !== userId) {
        res.status(403).json({
          success: false,
          message: 'You can only assign your own workshop'
        } as IApiResponse);
        return;
      }

      // If worker is assigned, verify they belong to the workshop
      if (assigned_worker_id) {
        const worker = await Worker.findOne({
          where: {
            id: assigned_worker_id,
            workshop_id: workshop_id
          }
        });

        if (!worker) {
          res.status(404).json({
            success: false,
            message: 'Worker not found in this workshop'
          } as IApiResponse);
          return;
        }
      }

      // Update service request
      await serviceRequest.update({
        workshop_id,
        assigned_worker_id: assigned_worker_id || null,
        status: ServiceRequestStatus.ACCEPTED
      });

      // Fetch updated service request
      const updatedServiceRequest = await ServiceRequest.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address'] },
          { model: Worker, as: 'assignedWorker', attributes: ['id', 'name', 'phone'] }
        ]
      });

      res.json({
        success: true,
        message: 'Workshop assigned successfully',
        data: updatedServiceRequest
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error assigning workshop:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign workshop',
        error: error.message
      } as IApiResponse);
    }
  }

  // Assign worker to service request
  static async assignWorker(req: IAuthenticatedRequest, res: Response): Promise<void> {
    console.log('=== ASSIGN WORKER ENDPOINT CALLED ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('User info:', { userId: req.user?.userId, role: req.user?.role });
    console.log('Request headers:', {
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      authorization: req.headers.authorization ? 'Bearer [REDACTED]' : 'None'
    });
    
    try {
      const { id } = req.params;
      const { assigned_worker_id } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      console.log('Extracted values:', { id, assigned_worker_id, userId, userRole });

      if (!userId) {
        console.log('Authentication required - no userId');
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      console.log('Finding service request with id:', id);
      const serviceRequest = await ServiceRequest.findByPk(id);
      console.log('Service request found:', serviceRequest ? 'YES' : 'NO');
      
      if (!serviceRequest) {
        console.log('Service request not found');
        res.status(404).json({
          success: false,
          message: 'Service request not found'
        } as IApiResponse);
        return;
      }

      console.log('Service request details:', {
        id: serviceRequest.id,
        workshop_id: serviceRequest.workshop_id,
        assigned_worker_id: serviceRequest.assigned_worker_id,
        status: serviceRequest.status
      });

      // Check if service request has a workshop assigned
      if (!serviceRequest.workshop_id) {
        console.log('Service request has no workshop assigned');
        res.status(400).json({
          success: false,
          message: 'Service request must be assigned to a workshop first'
        } as IApiResponse);
        return;
      }

      console.log('Checking user access to workshop:', serviceRequest.workshop_id);
      // Check if user has access to this workshop
      const hasAccess = (
        userRole === UserRole.ADMIN ||
        await this.userOwnsWorkshop(userId, serviceRequest.workshop_id)
      );

      console.log('User has access:', hasAccess);

      if (!hasAccess) {
        console.log('Access denied for user');
        res.status(403).json({
          success: false,
          message: 'Access denied'
        } as IApiResponse);
        return;
      }

      // If worker is being assigned, verify they belong to the workshop and update availability
      if (assigned_worker_id) {
        const worker = await Worker.findOne({
          where: {
            id: assigned_worker_id,
            workshop_id: serviceRequest.workshop_id
          }
        });

        if (!worker) {
          res.status(404).json({
            success: false,
            message: 'Worker not found in this workshop'
          } as IApiResponse);
          return;
        }

        // Check if worker is available
        if (!worker.is_available) {
          res.status(400).json({
            success: false,
            message: 'Selected worker is currently not available'
          } as IApiResponse);
          return;
        }
      }

      // If unassigning a worker, make them available again
      if (!assigned_worker_id && serviceRequest.assigned_worker_id) {
        const previousWorker = await Worker.findByPk(serviceRequest.assigned_worker_id);
        if (previousWorker) {
          await previousWorker.update({ is_available: true });
        }
      }

      // Update service request with assigned worker
      await serviceRequest.update({
        assigned_worker_id: assigned_worker_id || null
      });

      // If assigning a worker, mark them as busy
      if (assigned_worker_id) {
        const worker = await Worker.findByPk(assigned_worker_id);
        if (worker) {
          await worker.update({ is_available: false });
        }
      }

      // Fetch updated service request
      const updatedServiceRequest = await ServiceRequest.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address'] },
          { model: Worker, as: 'assignedWorker', attributes: ['id', 'name', 'phone', 'specialization'] }
        ]
      });

      res.json({
        success: true,
        message: assigned_worker_id ? 'Worker assigned successfully' : 'Worker unassigned successfully',
        data: updatedServiceRequest
      } as IApiResponse);
    } catch (error: any) {
      console.error('=== ERROR IN ASSIGN WORKER ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to assign worker',
        error: error.message
      } as IApiResponse);
    }
  }

  // Get all services by workshop ID
  static async getServicesByWorkshopId(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: workshopId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      if (!workshopId) {
        res.status(400).json({
          success: false,
          message: 'Workshop ID is required'
        } as IApiResponse);
        return;
      }

      // Verify workshop exists
      const workshop = await Workshop.findByPk(workshopId);
      if (!workshop) {
        res.status(404).json({
          success: false,
          message: 'Workshop not found'
        } as IApiResponse);
        return;
      }

      // Get all services for the workshop
      const services = await Service.findAll({
        where: {
          workshop_id: workshopId
        },
        include: [
          {
            model: Workshop,
            as: 'workshop',
            attributes: ['id', 'name', 'address', 'phone', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        success: true,
        message: 'Services retrieved successfully',
        data: services,
        meta: {
          total: services.length,
          workshop_id: workshopId,
          workshop_name: workshop.name
        }
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error fetching services by workshop ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch services',
        error: error.message
      } as IApiResponse);
    }
  }

  // Helper method to check if user owns a workshop
  private static async userOwnsWorkshop(userId: string, workshopId: string): Promise<boolean> {
    const workshop = await Workshop.findOne({
      where: {
        id: workshopId,
        ownerId: userId
      }
    });
    return !!workshop;
  }
}

export default ServiceRequestController;
