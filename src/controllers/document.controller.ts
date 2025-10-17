import { Request, Response } from "express";
import Document from "../models/document.model";
import Patient from "../models/patient.model";
import path from "path";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from "../config/env";
import streamifier from "streamifier";
import https from 'https';
import { emitActivityUpdate } from "../utils/socket";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { patientId, customName } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileId = crypto.randomUUID();
    const fileExtension = path.extname(req.file.originalname);
    const safeBaseName =
      (customName || req.file.originalname.replace(/\.[^/.]+$/, ""))
        .trim()
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .slice(0, 80) || "document";

    const storedFileName = `${fileId}${fileExtension}`; // internal storage name
    const displayFileName = `${safeBaseName}${fileExtension}`;
    const isImage = req.file.mimetype.startsWith("image/");
    let fileData: string | undefined = undefined;
    let remoteUrl: string | undefined = undefined;

    if (isImage && CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      // Upload to Cloudinary via stream
      const uploadResult: any = await new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { folder: "carekeep/patient-documents" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(req.file!.buffer).pipe(upload);
      });
      remoteUrl = uploadResult.secure_url;
    } else {
      fileData = req.file.buffer.toString("base64");
    }

    // Create doc instance first to know _id for URL
    const doc = new Document({
      patientId,
      fileName: displayFileName,
      originalFileName: req.file.originalname,
      storedFileName,
      storageId: fileId,
      fileData, // Only for non-image or fallback
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileUrl: "",
      remoteUrl,
    } as any);
    doc.fileUrl = `/api/documents/${doc._id}`;
    await doc.save();

    // Link to patient (create documents array if missing)
    try {
      await Patient.findByIdAndUpdate(patientId, {
        $addToSet: { documents: doc._id },
      });
    } catch (e) {
      // Non-fatal; continue
      console.error("Failed to link document to patient", e);
    }

    // Emit real-time activity update
    emitActivityUpdate((req as any).user.id, 'document', `Document uploaded: ${doc.fileName}`, doc);

    return res.json({
      id: doc._id,
      patientId: doc.patientId,
      fileName: doc.fileName,
      originalFileName: doc.originalFileName,
      fileUrl: doc.remoteUrl || doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      createdAt: doc.createdAt,
      isRemote: !!doc.remoteUrl,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const getDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { download } = req.query as { download?: string };

    let doc = await Document.findById(id);
    if (!doc) doc = await Document.findOne({ storageId: id });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const remoteUrl: string | undefined = (doc as any).remoteUrl;

    // Remote (Cloudinary) handling
    if (!doc.fileData && remoteUrl) {
      if (download) {
        // Proxy-stream the remote resource so client fetch gets 200 not 302
        https.get(remoteUrl, (r) => {
          if (r.statusCode && r.statusCode >= 400) {
            res.status(r.statusCode).end();
            return;
          }
          res.setHeader('Content-Type', doc.mimeType || r.headers['content-type'] || 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
          if (r.headers['content-length']) res.setHeader('Content-Length', r.headers['content-length']);
          r.pipe(res);
        }).on('error', (e) => {
          res.status(500).json({ error: 'Failed to fetch remote file' });
        });
        return;
      }
      // Inline view still fine as redirect (faster CDN delivery)
      return res.redirect(302, remoteUrl);
    }

    if (doc.fileData) {
      const fileBuffer = Buffer.from(doc.fileData, "base64");
      res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
      const dispositionType = download ? 'attachment' : 'inline';
      res.setHeader("Content-Disposition", `${dispositionType}; filename="${doc.fileName}"`);
      res.setHeader("Content-Length", fileBuffer.length.toString());
      return res.send(fileBuffer);
    }
    return res.status(404).json({ error: "File data not found" });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const getDocumentsByPatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const documents = await Document.find({ patientId })
      .select("-fileData")
      .sort({ createdAt: -1 });
    return res.json(documents);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};
