import mongoose, { Document, Schema } from "mongoose";

export interface IDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  fileName: string; // Display (custom) name + extension
  originalFileName: string; // Original uploaded name
  storedFileName: string; // Internal stored filename (e.g., uuid.ext)
  storageId: string; // UUID reference
  fileUrl: string;
  remoteUrl?: string; // Cloudinary URL when stored remotely
  fileData?: string; // Base64 encoded file data (temporary solution)
  fileSize?: number;
  mimeType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    fileName: { type: String, required: true },
    originalFileName: { type: String, required: true },
    storedFileName: { type: String, required: true },
    storageId: { type: String, required: true },
    fileUrl: { type: String, required: true },
    remoteUrl: { type: String },
    fileData: { type: String }, // Store base64 data temporarily
    fileSize: { type: Number },
    mimeType: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IDocument>("Document", documentSchema);
