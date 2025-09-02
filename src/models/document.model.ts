import mongoose, { Document, Schema } from "mongoose";

export interface IDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  fileName: string;
  fileUrl: string;
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
    fileUrl: { type: String, required: true },
    fileData: { type: String }, // Store base64 data temporarily
    fileSize: { type: Number },
    mimeType: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IDocument>("Document", documentSchema);
