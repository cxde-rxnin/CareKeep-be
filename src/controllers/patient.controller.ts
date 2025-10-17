import { Request, Response } from "express";
import Patient from "../models/patient.model";
import { emitActivityUpdate } from "../utils/socket";

export const createPatient = async (req: Request, res: Response) => {
  try {
    // Add the hospital ID from the authenticated user
    const patientData = {
      ...req.body,
      hospital: (req as any).user.id
    };
    const patient = await Patient.create(patientData);
    
    // Emit real-time activity update
    emitActivityUpdate((req as any).user.id, 'patient', `New patient: ${patient.name || 'Unnamed'}`, patient);
    
    res.json(patient);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const listPatients = async (req: Request, res: Response) => {
  try {
    // Only return patients for the logged-in hospital
    const hospitalId = (req as any).user.id;
    const patients = await Patient.find({ 
      $or: [
        { hospital: hospitalId },
        { doctor: hospitalId } // Backward compatibility
      ]
    }).populate("records");
    res.json(patients);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getPatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hospitalId = (req as any).user.id;
    const patient = await Patient.findOne({
      _id: id,
      $or: [
        { hospital: hospitalId },
        { doctor: hospitalId }
      ]
    })
    .populate('records')
    .populate({ path: 'documents', select: '-fileData', options: { sort: { createdAt: -1 } } });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hospitalId = (req as any).user.id;
    
    // Only allow updates to patients belonging to the logged-in hospital
    const patient = await Patient.findOneAndUpdate(
      { 
        _id: id, 
        $or: [
          { hospital: hospitalId },
          { doctor: hospitalId } // Backward compatibility
        ]
      },
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

// Update status / discharge / medication only
export const updatePatientStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hospitalId = (req as any).user.id;
    const { patientStatus, dischargeDate, dischargeTime, lastTreatmentDate, medication, medicationAmount, medicationDuration } = req.body;

    const update: any = {};
    if (patientStatus) update.patientStatus = patientStatus;
    if (dischargeDate) update.dischargeDate = dischargeDate;
    if (dischargeTime) update.dischargeTime = dischargeTime;
    if (lastTreatmentDate) update.lastTreatmentDate = lastTreatmentDate;
    if (medication) update.medication = medication;
    if (medicationAmount) update.medicationAmount = medicationAmount;
    if (medicationDuration) update.medicationDuration = medicationDuration;

    const patient = await Patient.findOneAndUpdate(
      { _id: id, hospital: hospitalId },
      { $set: update },
      { new: true }
    );

    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
