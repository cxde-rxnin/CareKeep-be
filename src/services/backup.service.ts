import Backup from "../models/backup.model";
import Patient from "../models/patient.model";
import User from "../models/user.model";
import path from "path";
import fs from "fs/promises";
import * as fsSync from "fs";
import PDFDocument from "pdfkit";

export const createBackup = async (userId: string) => {
  try {
    // Get data for the specific doctor
    const patients = await Patient.find({ doctor: userId }).lean();
    const doctor = await User.findById(userId).select('-password').lean();
    
    // Create backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `carekeep-backup-${doctor?.name?.replace(/\s+/g, '-') || 'doctor'}-${timestamp}.pdf`;
    const backupsDir = path.join(process.cwd(), 'backups');
    const filepath = path.join(backupsDir, filename);

    // Ensure backups directory exists
    await fs.mkdir(backupsDir, { recursive: true });

    // Create PDF
    await createPDFBackup(filepath, doctor, patients);

    // Create database record
    return await Backup.create({ 
      status: "completed",
      snapshotKey: filename,
      filePath: filepath,
      doctor: userId
    });
  } catch (error) {
    console.error('Backup creation failed:', error);
    return await Backup.create({ 
      status: "failed",
      snapshotKey: `failed-backup-${new Date().toISOString()}`,
      error: error instanceof Error ? error.message : 'Unknown error',
      doctor: userId
    });
  }
};

export const listBackups = async (userId: string) => {
  return await Backup.find({ doctor: userId }).sort({ createdAt: -1 });
};

export const getBackupFile = async (backupId: string, userId: string) => {
  const backup = await Backup.findOne({ _id: backupId, doctor: userId });
  if (!backup || backup.status !== 'completed' || !backup.filePath) {
    throw new Error('Backup not found or not available for download');
  }
  
  try {
    await fs.access(backup.filePath);
    return {
      backup,
      filePath: backup.filePath,
      filename: backup.snapshotKey
    };
  } catch (error) {
    throw new Error('Backup file not found on disk');
  }
};

const createPDFBackup = async (filepath: string, doctor: any, patients: any[]) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = doc.pipe(fsSync.createWriteStream(filepath));

      // Header
      doc.fontSize(24).fillColor('#065f46').text('CareKeep Medical Backup', 50, 50);
      doc.fontSize(14).fillColor('#374151').text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
      doc.text(`Doctor: ${doctor?.name || 'Unknown'}`, 50, 100);
      doc.text(`Email: ${doctor?.email || 'Unknown'}`, 50, 120);
      
      // Add a line separator
      doc.moveTo(50, 150).lineTo(550, 150).stroke('#e5e7eb');
      
      let yPosition = 170;
      
      // Patient Summary
      doc.fontSize(18).fillColor('#065f46').text('Patient Summary', 50, yPosition);
      yPosition += 30;
      doc.fontSize(14).fillColor('#374151').text(`Total Patients: ${patients.length}`, 50, yPosition);
      yPosition += 30;
      
      if (patients.length > 0) {
        // Patient Details
        doc.fontSize(16).fillColor('#065f46').text('Patient Details', 50, yPosition);
        yPosition += 30;
        
        patients.forEach((patient, index) => {
          // Check if we need a new page
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          // Patient header
          doc.fontSize(14).fillColor('#1f2937').text(`${index + 1}. ${patient.name}`, 50, yPosition);
          yPosition += 20;
          
          // Patient details
          doc.fontSize(11).fillColor('#6b7280');
          
          // Calculate age
          let age = 'Unknown';
          if (patient.dateOfBirth) {
            const birthDate = new Date(patient.dateOfBirth);
            const today = new Date();
            const calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age = (calculatedAge - 1).toString();
            } else {
              age = calculatedAge.toString();
            }
          }
          
          doc.text(`   Date of Birth: ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'Not provided'}`, 50, yPosition);
          yPosition += 15;
          doc.text(`   Age: ${age} years`, 50, yPosition);
          yPosition += 15;
          doc.text(`   Gender: ${patient.gender || 'Not provided'}`, 50, yPosition);
          yPosition += 15;
          doc.text(`   Phone: ${patient.phone || 'Not provided'}`, 50, yPosition);
          yPosition += 15;
          doc.text(`   Email: ${patient.email || 'Not provided'}`, 50, yPosition);
          yPosition += 15;
          doc.text(`   Address: ${patient.address || 'Not provided'}`, 50, yPosition);
          yPosition += 15;
          
          if (patient.medicalHistory && patient.medicalHistory.length > 0) {
            doc.text(`   Medical History:`, 50, yPosition);
            yPosition += 15;
            doc.text(`     ${patient.medicalHistory}`, 50, yPosition);
            yPosition += 15;
          }
          
          if (patient.currentMedications && patient.currentMedications.length > 0) {
            doc.text(`   Current Medications:`, 50, yPosition);
            yPosition += 15;
            doc.text(`     ${patient.currentMedications}`, 50, yPosition);
            yPosition += 15;
          }
          
          if (patient.allergies && patient.allergies.length > 0) {
            doc.text(`   Allergies:`, 50, yPosition);
            yPosition += 15;
            doc.text(`     ${patient.allergies}`, 50, yPosition);
            yPosition += 15;
          }
          
          doc.text(`   Record Created: ${new Date(patient.createdAt).toLocaleDateString()}`, 50, yPosition);
          yPosition += 15;
          
          if (patient.updatedAt && patient.updatedAt !== patient.createdAt) {
            doc.text(`   Last Updated: ${new Date(patient.updatedAt).toLocaleDateString()}`, 50, yPosition);
            yPosition += 15;
          }
          
          // Add spacing between patients
          yPosition += 20;
          
          // Add a light separator line
          if (index < patients.length - 1) {
            doc.moveTo(50, yPosition - 10).lineTo(550, yPosition - 10).stroke('#f3f4f6');
          }
        });
      } else {
        doc.fontSize(12).fillColor('#6b7280').text('No patients found in the system.', 50, yPosition);
      }
      
      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(10).fillColor('#9ca3af')
         .text('Generated by CareKeep Medical Records System', 50, pageHeight - 50)
         .text(`Backup ID: ${new Date().getTime()}`, 50, pageHeight - 35)
         .text('This document contains confidential medical information', 50, pageHeight - 20);
      
      doc.end();
      
      stream.on('finish', () => resolve(undefined));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};
