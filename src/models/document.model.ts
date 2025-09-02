import mongoose, { Document, Schema } from "mongoose";

export interface IDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  fileName: string;
  fileUrl: string;
}

const documentSchema = new Schema<IDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IDocument>("Document", documentSchema);
