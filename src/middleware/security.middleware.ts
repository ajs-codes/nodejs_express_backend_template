import helmet from 'helmet';
import express from 'express';

export const securityMiddleware = [
  helmet(),
  express.json({ limit: '1mb' }),
  express.urlencoded({ extended: false, limit: '1mb' }),
];
