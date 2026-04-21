import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sequelize } from '../config/db';
import { User, Workshop } from '../models';
import { ICreateWorkshop, IUpdateWorkshop, IWorkshopFilters, UserRole } from '../types';

// GET /workshops - Get all workshops with filters, pagination, and search
const getWorkshops = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      latitude,
      longitude,
      radius = 50, // Default 50km radius
      search,
      sort = 'newest',
      page = 1,
      limit = 20
    }: IWorkshopFilters = req.query as any;

    // Build where conditions
    const whereConditions: any = {};
    
    // Status filter
    if (status) {
      whereConditions.status = status;
    }

    // Search filter (name or address)
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Calculate offset for pagination
    const offset = (Number(page) - 1) * Number(limit);

    // Base query options
    const queryOptions: any = {
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      limit: Number(limit),
      offset: offset,
      distinct: true
    };

    // Handle distance-based filtering and sorting
    if (latitude && longitude) {
      // Use Haversine formula in SQL for distance calculation
      const haversineFormula = `
        (6371 * acos(cos(radians(${latitude})) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(${longitude})) + 
        sin(radians(${latitude})) * sin(radians(latitude))))
      `;

      // Add distance calculation to query
      queryOptions.attributes = {
        include: [
          [sequelize.literal(haversineFormula), 'distance']
        ]
      };

      // Filter by radius if specified
      if (radius) {
        queryOptions.having = sequelize.where(
          sequelize.literal(haversineFormula),
          '<=',
          Number(radius)
        );
      }

      // Sort by distance if requested
      if (sort === 'nearest') {
        queryOptions.order = [[sequelize.literal('distance'), 'ASC']];
      }
    }

    // Handle other sorting options
    if (sort === 'mostRated') {
      queryOptions.order = [['rating', 'DESC']];
    } else if (sort === 'newest') {
      queryOptions.order = [['createdAt', 'DESC']];
    } else if (sort === 'oldest') {
      queryOptions.order = [['createdAt', 'ASC']];
    }

    // Execute query
    const { rows: workshops, count: totalCount } = await Workshop.findAndCountAll(queryOptions);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPreviousPage = Number(page) > 1;

    res.status(200).json({
      success: true,
      message: 'Workshops retrieved successfully.',
      data: {
        workshops,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount,
          limit: Number(limit),
          hasNextPage,
          hasPreviousPage
        },
        filters: {
          status,
          search,
          radius: latitude && longitude ? Number(radius) : null,
          location: latitude && longitude ? { latitude: Number(latitude), longitude: Number(longitude) } : null
        }
      }
    });

  } catch (error) {
    console.error('Get workshops error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving workshops.'
    });
  }
};

// GET /workshops/:id - Get workshop by ID
const getWorkshopById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone', 'role']
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

    res.status(200).json({
      success: true,
      message: 'Workshop retrieved successfully.',
      data: workshop
    });

  } catch (error) {
    console.error('Get workshop by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving workshop.'
    });
  }
};

// POST /workshops - Create new workshop (Protected - MECHANIC_OWNER only)
const createWorkshop = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { name, description, address, latitude, longitude, image_url, status }: ICreateWorkshop = req.body;

    // Validate required fields
    if (!name || !description || !address || latitude === undefined || longitude === undefined) {
      res.status(400).json({
        success: false,
        message: 'Name, description, address, latitude, and longitude are required.'
      });
      return;
    }

    // Check if user is MECHANIC_OWNER
    if (user.role !== UserRole.MECHANIC_OWNER) {
      res.status(403).json({
        success: false,
        message: 'Only mechanic owners can create workshops.'
      });
      return;
    }

    // Create workshop
    const workshop = await Workshop.create({
      name,
      description,
      address,
      latitude,
      longitude,
      image_url: image_url || null,
      status: status || 'OPEN',
      ownerId: user.userId  // Fixed: use user.userId instead of user.id
    });

    // Fetch created workshop with owner info
    const createdWorkshop = await Workshop.findByPk(workshop.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Workshop created successfully.',
      data: createdWorkshop
    });

  } catch (error) {
    console.error('Create workshop error:', error);
    
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

    if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({
        success: false,
        message: 'Invalid user reference. Please try logging in again.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating workshop.'
    });
  }
};

// PUT /workshops/:id - Update workshop (Protected - Owner or Admin only)
const updateWorkshop = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const updateData: IUpdateWorkshop = req.body;

    // Find workshop
    const workshop = await Workshop.findByPk(id);

    if (!workshop) {
      res.status(404).json({
        success: false,
        message: 'Workshop not found.'
      });
      return;
    }

    // Check permissions (owner or admin)
    if (workshop.ownerId !== user.userId && user.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'You can only update your own workshops.'
      });
      return;
    }

    // Update workshop
    await workshop.update(updateData);

    // Fetch updated workshop with owner info
    const updatedWorkshop = await Workshop.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Workshop updated successfully.',
      data: {
        workshop: updatedWorkshop
      }
    });

  } catch (error) {
    console.error('Update workshop error:', error);
    
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
      message: 'Internal server error while updating workshop.'
    });
  }
};

// DELETE /workshops/:id - Delete workshop (Protected - Owner or Admin only)
const deleteWorkshop = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Find workshop
    const workshop = await Workshop.findByPk(id);

    if (!workshop) {
      res.status(404).json({
        success: false,
        message: 'Workshop not found.'
      });
      return;
    }

    // Check permissions (owner or admin)
    if (workshop.ownerId !== user.userId && user.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own workshops.'
      });
      return;
    }

    // Delete workshop
    await workshop.destroy();

    res.status(200).json({
      success: true,
      message: 'Workshop deleted successfully.'
    });

  } catch (error) {
    console.error('Delete workshop error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting workshop.'
    });
  }
};

// GET /workshops/owner/:ownerId - Get workshops by ownerId
const getWorkshopsByOwnerId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ownerId } = req.params;

    const workshops = await Workshop.findAll({
      where: { ownerId },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!workshops.length) {
      res.status(404).json({
        success: true,
        message: 'No workshops found for the given ownerId.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Workshops retrieved successfully.',
      data: workshops
    });
  } catch (error) {
    console.error('Get workshops by ownerId error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving workshops by ownerId.'
    });
  }
};

export {
  getWorkshops,
  getWorkshopById,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  getWorkshopsByOwnerId
};
