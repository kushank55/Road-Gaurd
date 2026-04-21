import { Router } from 'express';
import QuotationController from '../controllers/quotationController';
import authenticateToken from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Quotation routes
router.post('/service-request/:service_request_id', QuotationController.createQuotation);
router.get('/service-request/:service_request_id', QuotationController.getQuotationsByServiceRequest);
router.get('/:id', QuotationController.getQuotationById);
router.patch('/:id', QuotationController.updateQuotation);
router.post('/:id/accept', QuotationController.acceptQuotation);
router.get('/workshop/my-quotations', QuotationController.getWorkshopQuotations);

export default router;
