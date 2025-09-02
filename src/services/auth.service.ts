import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";
import { JWT_SECRET } from "../config/env";

export const registerUser = async (data: Partial<IUser>) => {
  const hashedPassword = await bcrypt.hash(data.password!, 10);
  const user = new User({ ...data, password: hashedPassword });
  return await user.save();
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "1d"
  });

  return { user, token };
};
