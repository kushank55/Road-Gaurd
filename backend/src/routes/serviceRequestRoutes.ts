import { Router } from 'express';
import ServiceRequestController from '../controllers/serviceRequestController';
import authenticateToken from '../middlewares/authMiddleware';

const router = Router();

// Handle preflight requests for CORS
router.options('*', (req, res) => {
  console.log('OPTIONS preflight request for:', req.path);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// All routes require authentication
router.use(authenticateToken);

// Service request routes
router.post('/', ServiceRequestController.createServiceRequest);
router.get('/', ServiceRequestController.getServiceRequests);
router.get('/:id', ServiceRequestController.getServiceRequestById);
router.patch('/:id', ServiceRequestController.updateServiceRequest);
router.post('/:id/assign-workshop', ServiceRequestController.assignWorkshop);
router.patch('/:id/assign-worker', ServiceRequestController.assignWorker);

// Service routes
router.get('/workshop/:id/services', ServiceRequestController.getServicesByWorkshopId);

export default router;
