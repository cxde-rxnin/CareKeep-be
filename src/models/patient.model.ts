import mongoose, { Document, Schema } from "mongoose";

export interface IPatient extends Document {
  name: string;
  roomNumber?: string;
  folderType?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: Date; // (dob)
  patientStatus?: "Admitted" | "Discharged" | "Deceased"; // optional – default in schema
  dateAdmitted?: Date;
  timeAdmitted?: string; // HH:mm
  address?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactAddress?: string;
  doctorInCharge?: string;
  medication?: string;
  medicationAmount?: string;
  medicationDuration?: string;
  dischargeDate?: Date;
  dischargeTime?: string;
  lastTreatmentDate?: Date;
  hospital: mongoose.Types.ObjectId;
  medicalHistory?: string; // legacy
  currentMedications?: string; // legacy
  allergies?: string; // legacy
  records?: mongoose.Types.ObjectId[]; // legacy
  documents?: mongoose.Types.ObjectId[]; // new field for population
}

const patientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true },
    roomNumber: { type: String },
    folderType: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    dateOfBirth: { type: Date },
    patientStatus: { type: String, enum: ["Admitted", "Discharged", "Deceased"], default: "Admitted" },
    dateAdmitted: { type: Date },
    timeAdmitted: { type: String },
    address: { type: String },
    emergencyContactName: { type: String },
    emergencyContactNumber: { type: String },
    emergencyContactAddress: { type: String },
    doctorInCharge: { type: String },
    medication: { type: String },
    medicationAmount: { type: String },
    medicationDuration: { type: String },
    dischargeDate: { type: Date },
    dischargeTime: { type: String },
    lastTreatmentDate: { type: Date },
    hospital: { type: Schema.Types.ObjectId, ref: "User", required: true },
    medicalHistory: { type: String },
    currentMedications: { type: String },
    allergies: { type: String },
    records: [{ type: Schema.Types.ObjectId, ref: "Document" }],
    documents: [{ type: Schema.Types.ObjectId, ref: "Document" }] // new field for population
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual age derived from dateOfBirth
patientSchema.virtual('age').get(function (this: any) {
  if (!this.dateOfBirth) return undefined;
  const today = new Date();
  const dob = new Date(this.dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
});

// Provide backward compatible "dob" alias
patientSchema.virtual('dob').get(function (this: any) {
  return this.dateOfBirth;
});

export default mongoose.model<IPatient>("Patient", patientSchema);
