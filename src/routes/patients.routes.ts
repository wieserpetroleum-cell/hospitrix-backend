import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getPatients, getPatient, createPatient, updatePatient } from '../controllers/patients.controller';

const router = Router();

router.use(authenticate);

router.get('/', getPatients);
router.get('/:uid', getPatient);
router.post('/', requireRole(['admin', 'doctor', 'receptionist', 'nurse']), createPatient);
router.put('/:uid', requireRole(['admin', 'doctor', 'receptionist']), updatePatient);

export default router;
