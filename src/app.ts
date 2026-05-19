import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';

// Routes
import authRoutes from './routes/auth.routes';
import patientsRoutes from './routes/patients.routes';

const app = express();

// ─── SECURITY MIDDLEWARE ───────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:5173'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use('/api', limiter);

// ─── GENERAL MIDDLEWARE ────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ─── HEALTH CHECK ──────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    name: 'Hospitrix API',
    timestamp: new Date().toISOString(),
  });
});

// ─── API ROUTES ────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientsRoutes);

// More routes will be added here:
// app.use('/api/v1/appointments', appointmentsRoutes);
// app.use('/api/v1/consultations', consultationsRoutes);
// app.use('/api/v1/admissions', admissionsRoutes);
// app.use('/api/v1/billing', billingRoutes);
// app.use('/api/v1/radiology', radiologyRoutes);
// app.use('/api/v1/tpa', tpaRoutes);
// app.use('/api/v1/notifications', notificationsRoutes);
// app.use('/api/v1/admin', adminRoutes);

// ─── 404 HANDLER ──────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ─── ERROR HANDLER ─────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ─── START SERVER ──────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`
  🏥 Hospitrix API Running!
  ─────────────────────────
  Environment: ${env.NODE_ENV}
  Port: ${env.PORT}
  URL: http://localhost:${env.PORT}
  Health: http://localhost:${env.PORT}/health
  `);
});

export default app;
