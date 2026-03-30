import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  scheduleCampaign,
  sendCampaign,
  streamCampaignEvents,
  duplicateCampaign,
} from '../controllers/campaign.controller';
import {
  createCampaignSchema,
  updateCampaignSchema,
  scheduleCampaignSchema,
  campaignIdParamSchema,
} from '../validators/campaign.validator';
import { paginationSchema } from '../validators/common.validator';

const router = Router();

router.use(authMiddleware);

router.get('/', validate(paginationSchema), listCampaigns);
router.post('/', validate(createCampaignSchema), createCampaign);
// SSE route must be defined before /:id to avoid param collision
router.get('/:id/events', validate(campaignIdParamSchema), streamCampaignEvents);
router.get('/:id', validate(campaignIdParamSchema), getCampaign);
router.patch('/:id', validate(updateCampaignSchema), updateCampaign);
router.delete('/:id', validate(campaignIdParamSchema), deleteCampaign);
router.post('/:id/schedule', validate(scheduleCampaignSchema), scheduleCampaign);
router.post('/:id/send', validate(campaignIdParamSchema), sendCampaign);
router.post('/:id/duplicate', validate(campaignIdParamSchema), duplicateCampaign);

export default router;
