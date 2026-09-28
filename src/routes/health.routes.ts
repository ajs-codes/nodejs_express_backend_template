import { Router } from 'express';
import { healthController } from '../health/health.controller.js';

export const healthRoutes = Router();

healthRoutes.get('/live', healthController.live);
healthRoutes.get('/ready', healthController.ready);
healthRoutes.get('/', healthController.detailed);
