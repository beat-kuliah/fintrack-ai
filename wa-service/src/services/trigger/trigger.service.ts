import { logger } from '../../utils/logger';
import { EventType, TriggerCondition } from '../../types';
import { messageQueue } from '../queue/queue.service';
import { prisma } from '../../utils/prisma';

export class TriggerService {
  async executeTrigger(
    eventType: EventType,
    data: Record<string, any>
  ): Promise<void> {
    logger.info(`Executing triggers for event: ${eventType}`);

    // Get all enabled triggers for this event type
    const triggers = await prisma.trigger.findMany({
      where: {
        eventType,
        enabled: true,
      },
      include: {
        template: true,
      },
    });

    for (const trigger of triggers) {
      try {
        // Check if conditions match
        if (this.checkConditions(trigger.conditions as TriggerCondition, data)) {
          logger.info(`Trigger ${trigger.name} matched, executing...`);

          // Generate message from template
          const message = this.generateMessage(
            trigger.template.content,
            trigger.template.variables as string[],
            data
          );

          // Get user phone number from data
          const phoneNumber = data.phoneNumber || data.userPhoneNumber;
          const userId = data.userId;

          if (!phoneNumber || !userId) {
            logger.warn(
              `Trigger ${trigger.name} skipped: missing phoneNumber or userId`
            );
            continue;
          }

          // Create message record
          const messageRecord = await prisma.message.create({
            data: {
              userId,
              phoneNumber,
              message,
              templateId: trigger.templateId,
              status: 'PENDING',
            },
          });

          // Add to queue
          await messageQueue.add('send-message', {
            id: messageRecord.id,
            userId,
            phoneNumber,
            message,
            templateId: trigger.templateId,
            retryCount: 0,
          });

          logger.info(`Trigger ${trigger.name} executed successfully`);
        }
      } catch (error) {
        logger.error(`Error executing trigger ${trigger.name}:`, error);
      }
    }
  }

  private checkConditions(
    conditions: TriggerCondition,
    data: Record<string, any>
  ): boolean {
    // Check wallet_id
    if (conditions.walletId && data.walletId !== conditions.walletId) {
      return false;
    }

    // Check category_id
    if (conditions.categoryId && data.categoryId !== conditions.categoryId) {
      return false;
    }

    // Check amount threshold
    if (conditions.amountThreshold !== undefined) {
      const amount = data.amount || 0;
      if (amount < conditions.amountThreshold) {
        return false;
      }
    }

    // Check transaction type
    if (
      conditions.transactionType &&
      data.transactionType !== conditions.transactionType
    ) {
      return false;
    }

    return true;
  }

  private generateMessage(
    template: string,
    variables: string[],
    data: Record<string, any>
  ): string {
    let message = template;

    // Replace variables in template
    for (const variable of variables) {
      const value = data[variable] || '';
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      message = message.replace(regex, String(value));
    }

    return message;
  }

  async createTrigger(data: {
    name: string;
    eventType: EventType;
    conditions: Record<string, any>;
    templateId: string;
    enabled?: boolean;
    schedule?: string;
  }) {
    return prisma.trigger.create({
      data: {
        name: data.name,
        eventType: data.eventType,
        conditions: data.conditions,
        templateId: data.templateId,
        enabled: data.enabled ?? true,
        schedule: data.schedule,
      },
    });
  }

  async getTriggers(eventType?: EventType) {
    return prisma.trigger.findMany({
      where: eventType ? { eventType } : undefined,
      include: {
        template: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteTrigger(id: string) {
    return prisma.trigger.delete({
      where: { id },
    });
  }
}

export const triggerService = new TriggerService();

