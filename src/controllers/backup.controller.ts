import { Request, Response } from "express";
import * as backupService from "../services/backup.service";

export const create = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const backup = await backupService.createBackup(userId);
    res.json(backup);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const backups = await backupService.listBackups(userId);
    res.json(backups);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const download = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { backup, filePath, filename } = await backupService.getBackupFile(id, userId);
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};
