const fs = require('fs').promises;
const path = require('path');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

const EVIDENCE_TYPE_FOLDERS = {
  instructions: 'Instructions',
  studentOutputs: 'Student Outputs',
  ratedRubrics: 'Rated Rubrics'
};

const slugifyFolder = (value, fallback = 'item') => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  return raw
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80) || fallback;
};

const safeRename = async (fromPath, toPath) => {
  try {
    await fs.rename(fromPath, toPath);
  } catch (error) {
    if (error.code !== 'EXDEV') {
      throw error;
    }
    await fs.copyFile(fromPath, toPath);
    await fs.unlink(fromPath);
  }
};

const toUploadUrl = (absolutePath) => {
  const relative = path.relative(UPLOADS_ROOT, absolutePath).replace(/\\/g, '/');
  return `/uploads/${relative}`;
};

const buildFolderStructure = ({
  facultyName,
  subjectCode,
  sectionName,
  slotNumber,
  evidenceType
}) => {
  const facultyFolder = slugifyFolder(facultyName, 'faculty');
  const subjectFolder = slugifyFolder(subjectCode, 'subject');
  const sectionFolder = slugifyFolder(sectionName, 'section');
  const slotFolder = `CO${slotNumber}-A${slotNumber}`;
  const evidenceFolder = EVIDENCE_TYPE_FOLDERS[evidenceType] || 'Evidence';

  const relativeStoragePath = path.join(
    'evidence',
    facultyFolder,
    subjectFolder,
    sectionFolder,
    slotFolder,
    evidenceFolder
  );

  const googleDriveFolderPath = [
    'Faculty e-Portfolio',
    facultyFolder,
    subjectFolder,
    sectionFolder,
    slotFolder,
    evidenceFolder
  ].join('/');

  return { relativeStoragePath, googleDriveFolderPath };
};

const storeEvidenceFile = async ({
  file,
  facultyName,
  subjectCode,
  sectionName,
  slotNumber,
  evidenceType
}) => {
  const { relativeStoragePath, googleDriveFolderPath } = buildFolderStructure({
    facultyName,
    subjectCode,
    sectionName,
    slotNumber,
    evidenceType
  });

  const destinationDir = path.join(UPLOADS_ROOT, relativeStoragePath);
  await fs.mkdir(destinationDir, { recursive: true });

  const safeOriginal = slugifyFolder(path.basename(file.originalname, path.extname(file.originalname)), 'file');
  const extension = path.extname(file.originalname || '') || path.extname(file.filename || '') || '';
  const finalFileName = `${Date.now()}-${safeOriginal}${extension}`;
  const finalPath = path.join(destinationDir, finalFileName);

  await safeRename(file.path, finalPath);

  const fileUrl = toUploadUrl(finalPath);
  const webViewLink = fileUrl;

  return {
    provider: process.env.GDRIVE_ENABLED === 'true' ? 'gdrive' : 'local',
    evidenceType,
    originalName: file.originalname,
    fileName: finalFileName,
    mimeType: file.mimetype,
    size: file.size,
    fileUrl,
    filePath: finalPath,
    storageFolderPath: relativeStoragePath.replace(/\\/g, '/'),
    googleDriveFolderPath,
    webViewLink,
    uploadedAt: new Date()
  };
};

module.exports = {
  storeEvidenceFile
};
