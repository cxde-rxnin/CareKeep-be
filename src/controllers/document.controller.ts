import { Request, Response } from "express";
import Document from "../models/document.model";

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;
    const fileUrl = `/uploads/${req.file?.filename}`;
    const doc = await Document.create({ patientId, fileName: req.file?.originalname, fileUrl });
    res.json(doc);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
