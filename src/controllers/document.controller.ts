import { Request, Response } from "express";
import Document from "../models/document.model";
import path from "path";
import crypto from "crypto";

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate a unique filename
    const fileId = crypto.randomUUID();
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${fileId}${fileExtension}`;
    
    // For now, we'll store the file buffer as base64 in the database
    // In production, you should upload to cloud storage (S3, Cloudinary, etc.)
    const fileData = req.file.buffer.toString('base64');
    
    const doc = await Document.create({ 
      patientId, 
      fileName: req.file.originalname,
      fileUrl: `/api/documents/${fileId}`, // This would be the API endpoint to retrieve the file
      fileData, // Store the base64 data temporarily
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });
    
    res.json({
      id: doc._id,
      patientId: doc.patientId,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      createdAt: doc.createdAt
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (doc.fileData) {
      // Convert base64 back to buffer and serve the file
      const fileBuffer = Buffer.from(doc.fileData, 'base64');
      
      res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length.toString());
      
      return res.send(fileBuffer);
    } else {
      return res.status(404).json({ error: "File data not found" });
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getDocumentsByPatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    
    const documents = await Document.find({ patientId })
      .select('-fileData') // Don't include the file data in the list
      .sort({ createdAt: -1 });
    
    res.json(documents);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
