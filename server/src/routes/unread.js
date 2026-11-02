import { Router } from 'express';
import { getUnread, markConversationRead } from '../controllers/unreadController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getUnread);
router.post('/read', requireAuth, markConversationRead);

export default router;
