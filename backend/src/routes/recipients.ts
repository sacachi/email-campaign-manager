import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { listRecipients, createRecipient, getRecipientById, updateRecipient, deleteRecipient, bulkCreateRecipients, bulkDeleteRecipients, exportRecipients } from '../controllers/recipient.controller';
import { createRecipientSchema, updateRecipientSchema, bulkCreateRecipientSchema, bulkDeleteRecipientSchema, exportRecipientSchema } from '../validators/recipient.validator';
import { paginationSchema, idParamSchema } from '../validators/common.validator';

const router = Router();

router.use(authMiddleware);

router.get('/', validate(paginationSchema), listRecipients);
router.post('/', validate(createRecipientSchema), createRecipient);
router.post('/bulk', validate(bulkCreateRecipientSchema), bulkCreateRecipients);
router.post('/bulk-delete', validate(bulkDeleteRecipientSchema), bulkDeleteRecipients);
router.post('/export', validate(exportRecipientSchema), exportRecipients);
router.get('/:id', validate(idParamSchema), getRecipientById);
router.put('/:id', validate(updateRecipientSchema), updateRecipient);
router.delete('/:id', validate(idParamSchema), deleteRecipient);

export default router;
