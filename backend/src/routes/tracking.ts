import { Router, Request, Response } from 'express';
import { CampaignRecipient } from '../models';

const router = Router();

// 1×1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * GET /track/open/:token
 * Public — no auth required.
 * Token = base64url( campaignId:recipientId )
 * Records the first open and returns a tracking pixel.
 */
router.get('/open/:token', async (req: Request, res: Response) => {
  // Always respond with the pixel regardless of errors
  res.set({
    'Content-Type': 'image/gif',
    'Content-Length': TRANSPARENT_GIF.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
  res.end(TRANSPARENT_GIF);

  // Record open asynchronously (fire-and-forget)
  try {
    const decoded = Buffer.from(req.params.token, 'base64url').toString('utf8');
    const [campaignId, recipientId] = decoded.split(':');
    if (!campaignId || !recipientId) return;

    const row = await CampaignRecipient.findOne({
      where: { campaign_id: campaignId, recipient_id: recipientId },
    });

    // Only record the first open
    if (row && !row.opened_at) {
      await row.update({ opened_at: new Date() });
    }
  } catch {
    // Silently ignore — pixel already delivered
  }
});

export default router;
