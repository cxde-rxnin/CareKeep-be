import Backup from "../models/backup.model";
import Patient from "../models/patient.model";
import User from "../models/user.model";
import path from "path";
import fs from "fs/promises";
import * as fsSync from "fs";
import { sendBackupEmail } from "./email.service";

export const createBackup = async (userId: string) => {
  try {
    const patients = await Patient.find({
      $or: [ { hospital: userId }, { doctor: userId } ]
    }).lean();
    const hospital = await User.findById(userId).select('-password').lean();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = `carekeep-backup-${hospital?.hospitalName?.replace(/\s+/g, '-') || 'hospital'}-${timestamp}`;
    const filename = `${baseName}.csv`;
    const backupsDir = path.join(process.cwd(), 'backups');
    const filepath = path.join(backupsDir, filename);
    await fs.mkdir(backupsDir, { recursive: true });

    await createCSVBackup(filepath, hospital, patients);

    if (hospital?.email) {
      try {
        await sendBackupEmail(hospital.email, hospital.hospitalName, filepath, patients.length);
      } catch (emailError) {
        console.error('Failed to send backup email:', emailError);
      }
    }

    return await Backup.create({
      status: "completed",
      snapshotKey: filename,
      filePath: filepath,
      doctor: userId
    });
  } catch (error) {
    console.error('Backup creation failed:', error);
    return await Backup.create({
      status: "failed",
      snapshotKey: `failed-backup-${new Date().toISOString()}`,
      error: error instanceof Error ? error.message : 'Unknown error',
      doctor: userId
    });
  }
};

export const listBackups = async (userId: string) => {
  return await Backup.find({ doctor: userId }).sort({ createdAt: -1 });
};

export const getBackupFile = async (backupId: string, userId: string) => {
  const backup = await Backup.findOne({ _id: backupId, doctor: userId });
  if (!backup || backup.status !== 'completed' || !backup.filePath) {
    throw new Error('Backup not found or not available for download');
  }
  
  try {
    await fs.access(backup.filePath);
    return {
      backup,
      filePath: backup.filePath,
      filename: backup.snapshotKey
    };
  } catch (error) {
    throw new Error('Backup file not found on disk');
  }
};

const createCSVBackup = async (filepath: string, hospital: any, patients: any[]) => {
  const headersHospital = ['Hospital Name','Email','Address','Phone','Generated At','Total Patients'];
  const hospitalRow = [
    wrap(hospital?.hospitalName),
    wrap(hospital?.email),
    wrap(hospital?.address),
    wrap(hospital?.phoneNumber),
    wrap(new Date().toISOString()),
    wrap(patients.length)
  ];

  // Collect all unique patient keys to ensure we export all fields
  const patientKeys = new Set<string>();
  patients.forEach(p => Object.keys(p).forEach(k => {
    if (!['__v'].includes(k)) patientKeys.add(k);
  }));
  const orderedKeys = Array.from(patientKeys).sort();

  const patientHeader = ['Index', ...orderedKeys];

  let csv = '';
  csv += headersHospital.join(',') + '\n';
  csv += hospitalRow.join(',') + '\n\n';
  csv += patientHeader.join(',') + '\n';

  patients.forEach((p, idx) => {
    const row = [wrap(idx + 1)];
    orderedKeys.forEach(k => {
      let val: any = (p as any)[k];
      if (val === undefined || val === null) val = '';
      if (val instanceof Date) val = val.toISOString();
      if (typeof val === 'object' && !Array.isArray(val)) {
        try { val = JSON.stringify(val); } catch { val = '' }
      }
      if (Array.isArray(val)) {
        val = val.join('; ');
      }
      row.push(wrap(val));
    });
    csv += row.join(',') + '\n';
  });

  await fs.writeFile(filepath, csv, 'utf8');
};

function wrap(value: any) {
  const s = (value ?? '').toString().replace(/"/g, '""');
  return `"${s}"`;
}
