import { Request, Response } from 'express';
import { User, Workshop, Service, Review } from '../models';
import { ICreateService, ICreateReview, UserRole } from '../types';

// GET /workshops/:id - Get workshop details with owner, services, and reviews
const getWorkshopDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone', 'role']
        },
        {
          model: Service,
          as: 'services',
          order: [['createdAt', 'ASC']]
        },
        {
          model: Review,
          as: 'reviews',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name']
            }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!workshop) {
      res.status(404).json({
        success: false,
        message: 'Workshop not found.'
      });
      return;
    }

    // Calculate average rating from reviews
    const reviews = workshop.get('reviews') as any[];
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    res.status(200).json({
      success: true,
      message: 'Workshop details retrieved successfully.',
      data: {
        ...workshop.toJSON(),
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: reviews.length
      }
    });

  } catch (error) {
    console.error('Get workshop details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving workshop details.'
    });
  }
};

// GET /workshops/:id/services - Get workshop services
const getWorkshopServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if workshop exists
    const workshop = await Workshop.findByPk(id);
    if (!workshop) {
      res.status(404).json({
        success: false,
        message: 'Workshop not found.'
      });
      return;
    }

    const services = await Service.findAll({
      where: { workshop_id: id },
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: 'Workshop services retrieved successfully.',
      data: services
    });

  } catch (error) {
    console.error('Get workshop services error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving workshop services.'
    });
  }
};

// GET /workshops/:id/reviews - Get workshop reviews
const getWorkshopReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if workshop exists
    const workshop = await Workshop.findByPk(id);
    if (!workshop) {
      res.status(404).json({
        success: false,
        message: 'Workshop not found.'
      });
      return;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: reviews, count: totalCount } = await Review.findAndCountAll({
      where: { workshop_id: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: offset
    });

    // Calculate average rating
    const allReviews = await Review.findAll({
      where: { workshop_id: id },
      attributes: ['rating']
    });

    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
      : 0;

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPreviousPage = Number(page) > 1;

    res.status(200).json({
      success: true,
      message: 'Workshop reviews retrieved successfully.',
      data: reviews
    });

  } catch (error) {
    console.error('Get workshop reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving workshop reviews.'
    });
  }
};

// POST /workshops/:id/services - Add service to workshop (Protected - Owner only)
const addWorkshopService = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { 
      name, 
      description, 
      vehicle_model, 
      license_plate, 
      image_urls = [],
      location_address,
      location_latitude,
      location_longitude
    }: ICreateService = req.body;

    // Validate required fields
    if (!name || !description || !vehicle_model || !license_plate || !location_address || 
        location_latitude === undefined || location_longitude === undefined) {
      res.status(400).json({
        success: false,
        message: 'Service name, description, vehicle model, license plate, and location are required.'
      });
      return;
    }

    // Find workshop and check ownership
    const workshop = await Workshop.findByPk(id);
    if (!workshop) {
      res.status(404).json({
        success: false,
        message: 'Workshop not found.'
      });
      return;
    }

    // Check if user is the owner or admin
    if (workshop.ownerId !== user.userId && user.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'You can only add services to your own workshop.'
      });
      return;
    }

    // Create service
    const service = await Service.create({
      workshop_id: id,
      name,
      description,
      vehicle_model,
      license_plate,
      image_urls,
      location_address,
      location_latitude,
      location_longitude
    });

    res.status(201).json({
      success: true,
      message: 'Service added successfully.',
      data: {
        service
      }
    });

  } catch (error) {
    console.error('Add workshop service error:', error);
    
    const err = error as any;
    
    if (err.name === 'SequelizeValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors: err.errors.map((e: any) => ({
          field: e.path,
          message: e.message
        }))
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while adding service.'
    });
  }
};

// POST /workshops/:id/reviews - Add review to workshop (Protected - Authenticated users)
const addWorkshopReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { rating, comment }: ICreateReview = req.body;

    // Validate required fields
    if (!rating || !comment) {
      res.status(400).json({
        success: false,
        message: 'Rating and comment are required.'
      });
      return;
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5.'
      });
      return;
    }

    // Find workshop
    const workshop = await Workshop.findByPk(id);
    if (!workshop) {
      res.status(404).json({
        success: false,
        message: 'Workshop not found.'
      });
      return;
    }

    // Check if user is trying to review their own workshop
    if (workshop.ownerId === user.userId) {
      res.status(403).json({
        success: false,
        message: 'You cannot review your own workshop.'
      });
      return;
    }

    // Check if user has already reviewed this workshop
    const existingReview = await Review.findOne({
      where: {
        workshop_id: id,
        user_id: user.userId
      }
    });

    if (existingReview) {
      res.status(409).json({
        success: false,
        message: 'You have already reviewed this workshop.'
      });
      return;
    }

    // Create review
    const review = await Review.create({
      workshop_id: id,
      user_id: user.userId,
      rating,
      comment
    });

    // Fetch created review with user info
    const createdReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        }
      ]
    });

    // Update workshop average rating
    const allReviews = await Review.findAll({
      where: { workshop_id: id },
      attributes: ['rating']
    });

    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await workshop.update({ rating: Number(averageRating.toFixed(1)) });

    res.status(201).json({
      success: true,
      message: 'Review added successfully.',
      data: {
        review: createdReview
      }
    });

  } catch (error) {
    console.error('Add workshop review error:', error);
    
    const err = error as any;
    
    if (err.name === 'SequelizeValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors: err.errors.map((e: any) => ({
          field: e.path,
          message: e.message
        }))
      });
      return;
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({
        success: false,
        message: 'You have already reviewed this workshop.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while adding review.'
    });
  }
};

export {
  getWorkshopDetails,
  getWorkshopServices,
  getWorkshopReviews,
  addWorkshopService,
  addWorkshopReview
};
