import express from 'express';
import {
  getWorkshops,
  getWorkshopById,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  getWorkshopsByOwnerId
} from '../controllers/workshopController';
import {
  getWorkshopDetails,
  getWorkshopServices,
  getWorkshopReviews,
  addWorkshopService,
  addWorkshopReview
} from '../controllers/workshopDetailController';
import authMiddleware from '../middlewares/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getWorkshops);
router.get('/:id', getWorkshopById);
router.get('/owner/:ownerId', getWorkshopsByOwnerId);

// Workshop detail routes (public)
router.get('/:id/details', getWorkshopDetails);
router.get('/:id/services', getWorkshopServices);
router.get('/:id/reviews', getWorkshopReviews);

// Protected routes (require authentication)
router.post('/', authMiddleware, createWorkshop);
router.put('/:id', authMiddleware, updateWorkshop);
router.delete('/:id', authMiddleware, deleteWorkshop);

// Protected detail routes
router.post('/:id/services', authMiddleware, addWorkshopService);
router.post('/:id/reviews', authMiddleware, addWorkshopReview);

export default router;
