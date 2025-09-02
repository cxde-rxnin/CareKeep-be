import mongoose, { Document, Schema } from "mongoose";

export interface IBackup extends Document {
  backupDate: Date;
  status: "completed" | "failed" | "running";
  doctor: mongoose.Types.ObjectId;
  snapshotKey?: string;
  filePath?: string;
  error?: string;
}

const backupSchema = new Schema<IBackup>(
  {
    backupDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["completed", "failed", "running"], required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    snapshotKey: { type: String },
    filePath: { type: String },
    error: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IBackup>("Backup", backupSchema);
