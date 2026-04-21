import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Quotation from '../models/Quotation';
import ServiceRequest from '../models/ServiceRequest';
import Workshop from '../models/Workshop';
import User from '../models/User';
import { 
  ICreateQuotation,
  IAuthenticatedRequest,
  IApiResponse,
  UserRole,
  ServiceRequestStatus
} from '../types';
import moment from 'moment';

class QuotationController {
  // Create a new quotation
  static async createQuotation(req: IAuthenticatedRequest, res: Response): Promise<void> {
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

      // Only workshop owners/employees can create quotations
      if (userRole !== UserRole.MECHANIC_OWNER && userRole !== UserRole.MECHANIC_EMPLOYEE && userRole !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only workshop owners can create quotations'
        } as IApiResponse);
        return;
      }

      const quotationData: ICreateQuotation = req.body;

      // Validate required fields
      const requiredFields = ['service_charges', 'valid_until'];
      const missingFields = requiredFields.filter(field => !quotationData[field as keyof ICreateQuotation]);
      
      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        } as IApiResponse);
        return;
      }

      // Check if service request exists
      const serviceRequest = await ServiceRequest.findByPk(service_request_id);
      if (!serviceRequest) {
        res.status(404).json({
          success: false,
          message: 'Service request not found'
        } as IApiResponse);
        return;
      }

      // Find user's workshop
      const workshop = await Workshop.findOne({ where: { ownerId: userId } });
      if (!workshop && userRole !== UserRole.ADMIN) {
        res.status(404).json({
          success: false,
          message: 'Workshop not found. Only workshop owners can create quotations.'
        } as IApiResponse);
        return;
      }

      const workshopId = workshop?.id || req.body.workshop_id; // Admin can specify workshop_id

      // Check if quotation already exists for this service request and workshop
      const existingQuotation = await Quotation.findOne({
        where: {
          service_request_id,
          workshop_id: workshopId
        }
      });

      if (existingQuotation) {
        res.status(409).json({
          success: false,
          message: 'Quotation already exists for this service request'
        } as IApiResponse);
        return;
      }

      // Validate valid_until date
      if (new Date(quotationData.valid_until) <= new Date()) {
        res.status(400).json({
          success: false,
          message: 'Valid until date must be in the future'
        } as IApiResponse);
        return;
      }

      // Create quotation
      const quotation = await Quotation.create({
        service_request_id,
        workshop_id: workshopId,
        service_charges: quotationData.service_charges,
        variable_cost: quotationData.variable_cost || 0,
        spare_parts_cost: quotationData.spare_parts_cost || 0,
        total_amount: 0, // Will be calculated in model hook
        notes: quotationData.notes || null,
        valid_until: quotationData.valid_until,
        is_accepted: false
      });

      // Update service request status to QUOTED
      await serviceRequest.update({ status: ServiceRequestStatus.QUOTED });

      // Fetch the created quotation with associations
      const createdQuotation = await Quotation.findByPk(quotation.id, {
        include: [
          { 
            model: ServiceRequest, 
            as: 'serviceRequest',
            include: [
              { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
            ]
          },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address', 'phone'] }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Quotation created successfully',
        data: createdQuotation
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error creating quotation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create quotation',
        error: error.message
      } as IApiResponse);
    }
  }

  // Get all quotations for a service request
  static async getQuotationsByServiceRequest(req: IAuthenticatedRequest, res: Response): Promise<void> {
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

      // Check if service request exists and user has access to it
      const serviceRequest = await ServiceRequest.findByPk(service_request_id);
      if (!serviceRequest) {
        res.status(404).json({
          success: false,
          message: 'Service request not found'
        } as IApiResponse);
        return;
      }

      // Check access permissions
      const hasAccess = (
        userRole === UserRole.ADMIN ||
        serviceRequest.user_id === userId ||
        (serviceRequest.workshop_id && await this.userOwnsWorkshop(userId, serviceRequest.workshop_id))
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        } as IApiResponse);
        return;
      }

      // Get quotations
      const quotations = await Quotation.findAll({
        where: { service_request_id },
        include: [
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address', 'rating', 'image_url'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        message: 'Quotations retrieved successfully',
        data: quotations
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error getting quotations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get quotations',
        error: error.message
      } as IApiResponse);
    }
  }

  // Get single quotation by ID
  static async getQuotationById(req: IAuthenticatedRequest, res: Response): Promise<void> {
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

      const quotation = await Quotation.findByPk(id, {
        include: [
          { 
            model: ServiceRequest, 
            as: 'serviceRequest',
            include: [
              { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
            ]
          },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address', 'rating', 'image_url'] }
        ]
      });

      if (!quotation) {
        res.status(404).json({
          success: false,
          message: 'Quotation not found'
        } as IApiResponse);
        return;
      }

      // Check access permissions
      const serviceRequest = await ServiceRequest.findByPk(quotation.service_request_id);
      const hasAccess = (
        userRole === UserRole.ADMIN ||
        (serviceRequest && serviceRequest.user_id === userId) ||
        await this.userOwnsWorkshop(userId, quotation.workshop_id)
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        } as IApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Quotation retrieved successfully',
        data: quotation
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error getting quotation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get quotation',
        error: error.message
      } as IApiResponse);
    }
  }

  // Accept a quotation
  static async acceptQuotation(req: IAuthenticatedRequest, res: Response): Promise<void> {
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

      const quotation = await Quotation.findByPk(id);

      if (!quotation) {
        res.status(404).json({
          success: false,
          message: 'Quotation not found'
        } as IApiResponse);
        return;
      }

      // Get the associated service request
      const serviceRequest = await ServiceRequest.findByPk(quotation.service_request_id);
      if (!serviceRequest) {
        res.status(404).json({
          success: false,
          message: 'Associated service request not found'
        } as IApiResponse);
        return;
      }

      // Only the service request owner can accept quotations
      if (userRole !== UserRole.ADMIN && serviceRequest.user_id !== userId) {
        res.status(403).json({
          success: false,
          message: 'Only the service request owner can accept quotations'
        } as IApiResponse);
        return;
      }

      // Check if quotation is still valid
      if (new Date(quotation.valid_until) <= new Date()) {
        res.status(400).json({
          success: false,
          message: 'Quotation has expired'
        } as IApiResponse);
        return;
      }

      // Check if quotation is already accepted
      if (quotation.is_accepted) {
        res.status(400).json({
          success: false,
          message: 'Quotation is already accepted'
        } as IApiResponse);
        return;
      }

      // Accept quotation
      await quotation.update({ is_accepted: true });

      // Update service request
      await serviceRequest.update({
        status: ServiceRequestStatus.ACCEPTED,
        workshop_id: quotation.workshop_id
      });

      // Reject other quotations for this service request
      await Quotation.update(
        { is_accepted: false },
        {
          where: {
            service_request_id: quotation.service_request_id,
            id: { [Op.ne]: quotation.id }
          }
        }
      );

      // Fetch updated quotation
      const updatedQuotation = await Quotation.findByPk(id, {
        include: [
          { 
            model: ServiceRequest, 
            as: 'serviceRequest',
            include: [
              { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
            ]
          },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address'] }
        ]
      });

      res.json({
        success: true,
        message: 'Quotation accepted successfully',
        data: updatedQuotation
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error accepting quotation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept quotation',
        error: error.message
      } as IApiResponse);
    }
  }

  // Update quotation (only if not accepted)
  static async updateQuotation(req: IAuthenticatedRequest, res: Response): Promise<void> {
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

      const quotation = await Quotation.findByPk(id);
      if (!quotation) {
        res.status(404).json({
          success: false,
          message: 'Quotation not found'
        } as IApiResponse);
        return;
      }

      // Only workshop owner can update quotation
      const hasAccess = (
        userRole === UserRole.ADMIN ||
        await this.userOwnsWorkshop(userId, quotation.workshop_id)
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        } as IApiResponse);
        return;
      }

      // Cannot update accepted quotations
      if (quotation.is_accepted) {
        res.status(400).json({
          success: false,
          message: 'Cannot update accepted quotation'
        } as IApiResponse);
        return;
      }

      // Update quotation
      await quotation.update(updateData);

      // Fetch updated quotation
      const updatedQuotation = await Quotation.findByPk(id, {
        include: [
          { 
            model: ServiceRequest, 
            as: 'serviceRequest',
            include: [
              { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
            ]
          },
          { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'address'] }
        ]
      });

      res.json({
        success: true,
        message: 'Quotation updated successfully',
        data: updatedQuotation
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error updating quotation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update quotation',
        error: error.message
      } as IApiResponse);
    }
  }

  // Get quotations for a workshop
  static async getWorkshopQuotations(req: IAuthenticatedRequest, res: Response): Promise<void> {
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

      // Only workshop owners can view their quotations
      if (userRole !== UserRole.MECHANIC_OWNER && userRole !== UserRole.MECHANIC_EMPLOYEE && userRole !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Only workshop owners can view quotations'
        } as IApiResponse);
        return;
      }

      // Find user's workshop
      const workshop = await Workshop.findOne({ where: { ownerId: userId } });
      if (!workshop && userRole !== UserRole.ADMIN) {
        res.status(404).json({
          success: false,
          message: 'Workshop not found'
        } as IApiResponse);
        return;
      }

      const workshopId = workshop?.id;
      
      // Get quotations
      const quotations = await Quotation.findAll({
        where: { workshop_id: workshopId },
        include: [
          { 
            model: ServiceRequest, 
            as: 'serviceRequest',
            include: [
              { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        message: 'Workshop quotations retrieved successfully',
        data: quotations
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error getting workshop quotations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get workshop quotations',
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

export default QuotationController;
