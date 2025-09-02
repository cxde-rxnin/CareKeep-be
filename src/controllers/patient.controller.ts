import { Request, Response } from "express";
import Patient from "../models/patient.model";

export const createPatient = async (req: Request, res: Response) => {
  try {
    // Add the doctor ID from the authenticated user
    const patientData = {
      ...req.body,
      doctor: (req as any).user.id
    };
    const patient = await Patient.create(patientData);
    res.json(patient);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const listPatients = async (req: Request, res: Response) => {
  try {
    // Only return patients for the logged-in doctor
    const doctorId = (req as any).user.id;
    const patients = await Patient.find({ doctor: doctorId }).populate("records");
    res.json(patients);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getPatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = (req as any).user.id;
    
    // Only allow access to patients belonging to the logged-in doctor
    const patient = await Patient.findOne({ _id: id, doctor: doctorId }).populate("records");
    
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    res.json(patient);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = (req as any).user.id;
    
    // Only allow updates to patients belonging to the logged-in doctor
    const patient = await Patient.findOneAndUpdate(
      { _id: id, doctor: doctorId },
      req.body, 
      { 
        new: true,
        runValidators: true 
      }
    ).populate("records");
    
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    res.json(patient);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
