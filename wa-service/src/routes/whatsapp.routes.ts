import { Router, Request, Response } from 'express';
import { whatsappService } from '../services/whatsapp/whatsapp.service';
import { authenticateApiKey } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import QRCode from 'qrcode';

const router = Router();

/**
 * Get WhatsApp connection status
 */
router.get('/status', (req: Request, res: Response): void => {
  try {
    const status = whatsappService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error getting WhatsApp status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get QR code for WhatsApp connection (as JSON with base64 image)
 */
router.get('/qr', authenticateApiKey, async (req: Request, res: Response): Promise<void> => {
  try {
    const qrCode = whatsappService.getQRCode();

    if (!qrCode) {
      res.status(404).json({
        error: 'QR code not available',
        message: 'WhatsApp is already connected or not in QR code state',
      });
      return;
    }

    // Convert QR code string to base64 image
    const qrImage = await QRCode.toDataURL(qrCode, {
      width: 300,
      margin: 2,
    });

    res.json({
      success: true,
      data: {
        qrCode: qrImage, // Base64 data URL
        qrString: qrCode, // Original string
        expiresIn: 60, // QR code expires in 60 seconds
      },
    });
  } catch (error) {
    logger.error('Error getting QR code:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get QR code as PNG image (direct image response)
 */
router.get('/qr/image', authenticateApiKey, async (req: Request, res: Response): Promise<void> => {
  try {
    const qrCode = whatsappService.getQRCode();

    if (!qrCode) {
      res.status(404).json({
        error: 'QR code not available',
        message: 'WhatsApp is already connected or not in QR code state',
      });
      return;
    }

    // Convert QR code string to PNG buffer
    const qrImageBuffer = await QRCode.toBuffer(qrCode, {
      width: 300,
      margin: 2,
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(qrImageBuffer);
  } catch (error) {
    logger.error('Error generating QR code image:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Reconnect WhatsApp manually
 */
router.post('/reconnect', authenticateApiKey, async (req: Request, res: Response): Promise<void> => {
  try {
    await whatsappService.reconnect();
    res.json({
      success: true,
      message: 'Reconnection initiated',
    });
  } catch (error) {
    logger.error('Error reconnecting WhatsApp:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

