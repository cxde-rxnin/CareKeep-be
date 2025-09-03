import { Request, Response } from 'express';
import Patient from '../models/patient.model';
import Backup from '../models/backup.model';
import Document from '../models/document.model';
import mongoose from 'mongoose';

interface BackupSelect {
  status: string;
  createdAt: Date;
}

interface PatientSelect {
  name: string;
  createdAt: Date;
}

interface DocumentSelect {
  fileName: string;
  createdAt: Date;
}

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const hospitalFilter = {
      $or: [
        { hospital: new mongoose.Types.ObjectId(userId) },
        { doctor: new mongoose.Types.ObjectId(userId) }
      ]
    } as any;

    const [patientCount, backupAgg, recentBackups, recentPatients, recentDocs] = await Promise.all([
      Patient.countDocuments(hospitalFilter),
      Backup.aggregate([
        { $match: { doctor: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Use proper typing with interfaces - cast through unknown first
      Backup.find({ doctor: userId }).sort({ createdAt: -1 }).limit(5).select('status createdAt').lean() as unknown as Promise<BackupSelect[]>,
      Patient.find(hospitalFilter).sort({ createdAt: -1 }).limit(5).select('name createdAt').lean() as unknown as Promise<PatientSelect[]>,
      Document.find({}).sort({ createdAt: -1 }).limit(5).select('fileName createdAt').lean() as unknown as Promise<DocumentSelect[]>
    ]);

    const backupStatusMap: Record<string, number> = { completed: 0, failed: 0, running: 0 };
    backupAgg.forEach(b => { backupStatusMap[b._id] = b.count; });

    const lastBackup = recentBackups[0]?.createdAt || null;

    const health = {
      api: 'healthy',
      backups: backupStatusMap.failed > 0 ? 'degraded' : 'operational',
      security: 'secure'
    };

    const activity = [
      ...recentBackups.map(b => ({
        type: 'backup' as const,
        status: b.status,
        at: b.createdAt,
        message: `Backup ${b.status}`
      })),
      ...recentPatients.map(p => ({
        type: 'patient' as const,
        at: p.createdAt,
        message: `New patient: ${p.name || 'Unnamed'}`
      })),
      ...recentDocs.map(d => ({
        type: 'document' as const,
        at: d.createdAt,
        message: `Document uploaded: ${d.fileName}`
      }))
    ].sort((a,b) => (b.at as any) - (a.at as any)).slice(0, 10);

    res.json({
      metrics: {
        patients: patientCount,
        backups: backupStatusMap.completed + backupStatusMap.failed + backupStatusMap.running,
        lastBackup,
        backupStatusMap
      },
      health,
      activity
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};