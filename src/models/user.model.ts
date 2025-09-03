import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  hospitalName: string;
  email: string;
  password: string;
  address: string;
  phoneNumber: string;
  role: "hospital";
}

const userSchema = new Schema<IUser>(
  {
    hospitalName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, enum: ["hospital"], default: "hospital" }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
