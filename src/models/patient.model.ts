import mongoose, { Document, Schema } from "mongoose";

export interface IPatient extends Document {
  name: string;
  age: number;
  dob: Date;
  gender: "male" | "female" | "other";
  doctor: mongoose.Types.ObjectId;
  medicalHistory: string[];
  records: mongoose.Types.ObjectId[];
}

const patientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    medicalHistory: [{ type: String }],
    records: [{ type: Schema.Types.ObjectId, ref: "Document" }]
  },
  { timestamps: true }
);

export default mongoose.model<IPatient>("Patient", patientSchema);
