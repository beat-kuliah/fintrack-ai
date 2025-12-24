import { Router } from 'express';
import { templateController } from '../controllers/template.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, (req, res) => {
  templateController.createTemplate(req, res);
});

router.get('/', (req, res) => {
  templateController.getTemplates(req, res);
});

router.get('/:id', (req, res) => {
  templateController.getTemplate(req, res);
});

router.put('/:id', authenticate, (req, res) => {
  templateController.updateTemplate(req, res);
});

router.delete('/:id', authenticate, (req, res) => {
  templateController.deleteTemplate(req, res);
});

export default router;

