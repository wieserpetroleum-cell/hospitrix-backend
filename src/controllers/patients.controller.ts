import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getPatients = async (req: AuthRequest, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const hospitalId = req.user!.hospitalId;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { hospitalId };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { uid: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    res.json({ patients, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPatient = async (req: AuthRequest, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { hospitalId_uid: { hospitalId: req.user!.hospitalId, uid: req.params.uid } },
      include: {
        appointments: { orderBy: { scheduledAt: 'desc' }, take: 10 },
        admissions: { orderBy: { admittedAt: 'desc' }, take: 5 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
      }
    });

    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createPatient = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;

    // Generate UID
    const count = await prisma.patient.count({ where: { hospitalId } });
    const year = new Date().getFullYear();
    const uid = `HX-${year}-${String(count + 1).padStart(4, '0')}`;

    const patient = await prisma.patient.create({
      data: { ...req.body, hospitalId, uid }
    });

    await prisma.auditLog.create({
      data: { hospitalId, userId: req.user!.id, action: 'created', module: 'patients', recordId: patient.id }
    });

    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updatePatient = async (req: AuthRequest, res: Response) => {
  try {
    const patient = await prisma.patient.update({
      where: { hospitalId_uid: { hospitalId: req.user!.hospitalId, uid: req.params.uid } },
      data: req.body
    });

    await prisma.auditLog.create({
      data: { hospitalId: req.user!.hospitalId, userId: req.user!.id, action: 'edited', module: 'patients', recordId: patient.id }
    });

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
