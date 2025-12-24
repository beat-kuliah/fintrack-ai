import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { CreateTemplateRequest } from '../types';
import { prisma } from '../utils/prisma';

export class TemplateController {
  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateTemplateRequest = req.body;

      if (!data.name || !data.content || !data.variables) {
        res.status(400).json({
          error: 'name, content, and variables are required',
        });
        return;
      }

      const template = await prisma.template.create({
        data: {
          name: data.name,
          content: data.content,
          variables: data.variables,
          description: data.description,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template,
      });
    } catch (error) {
      logger.error('Error creating template:', error);
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(409).json({
          error: 'Template with this name already exists',
        });
        return;
      }
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await prisma.template.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      logger.error('Error getting templates:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = await prisma.template.findUnique({
        where: { id },
      });

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      logger.error('Error getting template:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      const template = await prisma.template.update({
        where: { id },
        data: {
          name: data.name,
          content: data.content,
          variables: data.variables,
          description: data.description,
        },
      });

      res.json({
        success: true,
        message: 'Template updated successfully',
        data: template,
      });
    } catch (error) {
      logger.error('Error updating template:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.template.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting template:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const templateController = new TemplateController();

