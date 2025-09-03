import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || "5000";
export const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/medivault";
export const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Email configuration
export const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
export const EMAIL_PORT = process.env.EMAIL_PORT || "587";
export const EMAIL_USER = process.env.EMAIL_USER || "";
export const EMAIL_PASS = process.env.EMAIL_PASS || "";
export const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER || "";

// Cloudinary configuration
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || ''
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || ''
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || ''
