import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Worker from '../models/Worker';
import Workshop from '../models/Workshop';
import User from '../models/User';
import ServiceRequest from '../models/ServiceRequest';
import { 
  ICreateWorker,
  IAuthenticatedRequest,
  IApiResponse,
  UserRole
} from '../types';

class WorkerController {
  // Create a new worker
  static async createWorker(req: IAuthenticatedRequest, res: Response): Promise<void> {
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

      // Only workshop owners can create workers
      if (userRole !== UserRole.MECHANIC_OWNER && userRole !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only workshop owners can create workers'
        } as IApiResponse);
        return;
      }

      const workerData: ICreateWorker = req.body;

      // Validate required fields
      const requiredFields = ['user_id', 'name', 'phone', 'email', 'specialization'];
      const missingFields = requiredFields.filter(field => !workerData[field as keyof ICreateWorker]);
      
      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        } as IApiResponse);
        return;
      }

      // Find user's workshop
      const workshop = await Workshop.findOne({ where: { ownerId: userId } });
      if (!workshop && userRole !== UserRole.ADMIN) {
        res.status(404).json({
          success: false,
          message: 'Workshop not found. Only workshop owners can create workers.'
        } as IApiResponse);
        return;
      }

      const workshopId = workshop?.id || req.body.workshop_id; // Admin can specify workshop_id

      // Check if user exists and can be a worker
      const userToAdd = await User.findByPk(workerData.user_id);
      if (!userToAdd) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        } as IApiResponse);
        return;
      }

      // Check if worker already exists for this workshop and user
      const existingWorker = await Worker.findOne({
        where: {
          workshop_id: workshopId,
          user_id: workerData.user_id
        }
      });

      if (existingWorker) {
        res.status(409).json({
          success: false,
          message: 'Worker already exists for this workshop'
        } as IApiResponse);
        return;
      }

      // Create worker
      const worker = await Worker.create({
        workshop_id: workshopId,
        user_id: workerData.user_id,
        name: workerData.name,
        phone: workerData.phone,
        email: workerData.email,
        specialization: workerData.specialization,
        is_available: true,
        current_location_latitude: null,
        current_location_longitude: null
      });

      // Fetch the created worker with associations
      const createdWorker = await Worker.findByPk(worker.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role'] },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address'] }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Worker created successfully',
        data: createdWorker
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error creating worker:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create worker',
        error: error.message
      } as IApiResponse);
    }
  }

  // Get all workers for a workshop
  static async getWorkshopWorkers(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { id: workshopId } = req.params;

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

      // Check if the workshop exists
      const workshop = await Workshop.findByPk(workshopId);
      if (!workshop) {
        res.status(404).json({
          success: false,
          message: 'Workshop not found'
        } as IApiResponse);
        return;
      }

      // Authorization check: only workshop owner, employees, or admin can view workers
      const canView = (
        userRole === UserRole.ADMIN ||
        workshop.ownerId === userId ||
        userRole === UserRole.MECHANIC_EMPLOYEE
      );

      if (!canView) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        } as IApiResponse);
        return;
      }

      // Get workers
      const workers = await Worker.findAll({
        where: { workshop_id: workshopId },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Transform worker data to match frontend expectations (camelCase)
      const transformedWorkers = workers.map(worker => ({
        id: worker.id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        specialization: Array.isArray(worker.specialization) ? worker.specialization.join(', ') : (worker.specialization || ''),
        isAvailable: worker.is_available,
        workshopId: worker.workshop_id,
        createdAt: worker.createdAt,
        updatedAt: worker.updatedAt,
        user: worker.get('user')
      }));

      res.json({
        success: true,
        message: 'Workers retrieved successfully',
        data: transformedWorkers
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error getting workers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get workers',
        error: error.message
      } as IApiResponse);
    }
  }

  // Get single worker by ID
  static async getWorkerById(req: IAuthenticatedRequest, res: Response): Promise<void> {
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

      const worker = await Worker.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role'] },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address'] },
          { 
            model: ServiceRequest, 
            as: 'assignedRequests',
            where: { status: ['IN_PROGRESS', 'ACCEPTED'] },
            required: false,
            limit: 10,
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!worker) {
        res.status(404).json({
          success: false,
          message: 'Worker not found'
        } as IApiResponse);
        return;
      }

      // Check authorization
      const canAccess = (
        userRole === UserRole.ADMIN ||
        worker.user_id === userId ||
        await this.userOwnsWorkshop(userId, worker.workshop_id)
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
        message: 'Worker retrieved successfully',
        data: worker
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error getting worker:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get worker',
        error: error.message
      } as IApiResponse);
    }
  }

  // Update worker
  static async updateWorker(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      const worker = await Worker.findByPk(id);
      if (!worker) {
        res.status(404).json({
          success: false,
          message: 'Worker not found'
        } as IApiResponse);
        return;
      }

      // Check if user can update this worker
      const canUpdate = (
        userRole === UserRole.ADMIN ||
        worker.user_id === userId ||
        await this.userOwnsWorkshop(userId, worker.workshop_id)
      );

      if (!canUpdate) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        } as IApiResponse);
        return;
      }

      // Update the worker
      await worker.update(updateData);

      // Fetch updated worker with associations
      const updatedWorker = await Worker.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role'] },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address'] }
        ]
      });

      res.json({
        success: true,
        message: 'Worker updated successfully',
        data: updatedWorker
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error updating worker:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update worker',
        error: error.message
      } as IApiResponse);
    }
  }

  // Update worker availability
  static async updateWorkerAvailability(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { is_available } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      const worker = await Worker.findByPk(id);
      if (!worker) {
        res.status(404).json({
          success: false,
          message: 'Worker not found'
        } as IApiResponse);
        return;
      }

      // Only the worker themselves can update their availability
      if (worker.user_id !== userId) {
        res.status(403).json({
          success: false,
          message: 'Only the worker can update their own availability'
        } as IApiResponse);
        return;
      }

      await worker.update({ is_available });

      res.json({
        success: true,
        message: 'Worker availability updated successfully',
        data: { is_available }
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error updating worker availability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update worker availability',
        error: error.message
      } as IApiResponse);
    }
  }

  // Update worker location
  static async updateWorkerLocation(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { latitude, longitude } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      const worker = await Worker.findByPk(id);
      if (!worker) {
        res.status(404).json({
          success: false,
          message: 'Worker not found'
        } as IApiResponse);
        return;
      }

      // Only the worker themselves can update their location
      if (worker.user_id !== userId) {
        res.status(403).json({
          success: false,
          message: 'Only the worker can update their own location'
        } as IApiResponse);
        return;
      }

      await worker.update({
        current_location_latitude: latitude,
        current_location_longitude: longitude
      });

      res.json({
        success: true,
        message: 'Worker location updated successfully',
        data: { latitude, longitude }
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error updating worker location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update worker location',
        error: error.message
      } as IApiResponse);
    }
  }

  // Delete worker
  static async deleteWorker(req: IAuthenticatedRequest, res: Response): Promise<void> {
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

      const worker = await Worker.findByPk(id);
      if (!worker) {
        res.status(404).json({
          success: false,
          message: 'Worker not found'
        } as IApiResponse);
        return;
      }

      // Only workshop owner or admin can delete workers
      const canDelete = (
        userRole === UserRole.ADMIN ||
        await this.userOwnsWorkshop(userId, worker.workshop_id)
      );

      if (!canDelete) {
        res.status(403).json({
          success: false,
          message: 'Only workshop owners can delete workers'
        } as IApiResponse);
        return;
      }

      await worker.destroy();

      res.json({
        success: true,
        message: 'Worker deleted successfully'
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error deleting worker:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete worker',
        error: error.message
      } as IApiResponse);
    }
  }

  // Get available workers for a service request
  static async getAvailableWorkers(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { service_request_id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      // Get service request
      const serviceRequest = await ServiceRequest.findByPk(service_request_id);
      if (!serviceRequest) {
        res.status(404).json({
          success: false,
          message: 'Service request not found'
        } as IApiResponse);
        return;
      }

      // Check if user has access
      const hasAccess = (
        userRole === UserRole.ADMIN ||
        (serviceRequest.workshop_id && await this.userOwnsWorkshop(userId, serviceRequest.workshop_id))
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        } as IApiResponse);
        return;
      }

      // Get available workers from the assigned workshop
      if (!serviceRequest.workshop_id) {
        res.status(400).json({
          success: false,
          message: 'Service request must be assigned to a workshop first'
        } as IApiResponse);
        return;
      }

      const workers = await Worker.findAll({
        where: {
          workshop_id: serviceRequest.workshop_id,
          is_available: true
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
        ],
        order: [['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        message: 'Available workers retrieved successfully',
        data: workers
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error getting available workers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available workers',
        error: error.message
      } as IApiResponse);
    }
  }

  // Get worker's calendar/schedule
  static async getWorkerCalendar(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { startDate, endDate } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      // Find the worker record for this user
      const worker = await Worker.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!worker && userRole !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Worker profile not found'
        } as IApiResponse);
        return;
      }

      // Build date filter
      const dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter[Op.or] = [
          {
            scheduled_start_time: {
              [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
            }
          },
          {
            scheduled_end_time: {
              [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
            }
          }
        ];
      } else if (startDate) {
        dateFilter.scheduled_start_time = {
          [Op.gte]: new Date(startDate as string)
        };
      } else if (endDate) {
        dateFilter.scheduled_end_time = {
          [Op.lte]: new Date(endDate as string)
        };
      }

      // Get assigned service requests for the worker
      const serviceRequests = await ServiceRequest.findAll({
        where: {
          assigned_worker_id: worker?.id,
          ...dateFilter
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'phone']
          }
        ],
        order: [['scheduled_start_time', 'ASC']]
      });

      // Format the calendar data
      const calendarData = serviceRequests.map(request => {
        const requestData = request as any; // Type assertion to access included relations
        return {
          id: request.id,
          title: request.name,
          description: request.description,
          start: request.scheduled_start_time,
          end: request.scheduled_end_time,
          status: request.status,
          priority: request.priority,
          service_type: request.service_type,
          location: {
            address: request.location_address,
            latitude: request.location_latitude,
            longitude: request.location_longitude
          },
          customer: requestData.user ? {
            name: requestData.user.name,
            email: requestData.user.email,
            phone: requestData.user.phone
          } : null,
          issue_description: request.issue_description,
          image_urls: request.image_urls,
          estimated_completion: request.estimated_completion,
          actual_completion: request.actual_completion
        };
      });

      res.status(200).json({
        success: true,
        message: 'Worker calendar retrieved successfully',
        data: {
          worker: {
            id: worker?.id,
            name: worker?.name,
            email: worker?.email,
            specialization: worker?.specialization,
            is_available: worker?.is_available
          },
          calendar: calendarData
        }
      } as IApiResponse);

    } catch (error: any) {
      console.error('Error retrieving worker calendar:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve worker calendar',
        error: error.message
      } as IApiResponse);
    }
  }

  // Get worker details by user ID
  static async getWorkerByUserId(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const targetUserId = req.params['userId'] || userId; // Allow fetching for self or specified user

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      // Find worker by user_id
      const worker = await Worker.findOne({
        where: { user_id: targetUserId },
        include: [
          {
            model: Workshop,
            as: 'workshop',
            attributes: ['id', 'name', 'address', 'contact_phone']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'phone', 'role']
          }
        ]
      });

      if (!worker) {
        res.status(404).json({
          success: false,
          message: 'Worker not found for this user'
        } as IApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Worker details retrieved successfully',
        data: {
          worker: {
            id: worker.id,
            workshop_id: worker.workshop_id,
            user_id: worker.user_id,
            name: worker.name,
            phone: worker.phone,
            email: worker.email,
            specialization: worker.specialization,
            is_available: worker.is_available,
            current_location_latitude: worker.current_location_latitude,
            current_location_longitude: worker.current_location_longitude,
            createdAt: worker.createdAt,
            updatedAt: worker.updatedAt,
            workshop: (worker as any).workshop,
            user: (worker as any).user
          }
        }
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error fetching worker by user ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve worker details',
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

export default WorkerController;
