import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/send', authenticate, (req, res) => {
  messageController.sendMessage(req as any, res);
});

router.post('/send-bulk', authenticate, (req, res) => {
  messageController.sendBulkMessages(req as any, res);
});

router.get('/status/:id', (req, res) => {
  messageController.getMessageStatus(req, res);
});

export default router;

