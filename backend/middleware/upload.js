const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept by MIME type first, then fall back to extension for browsers that send generic MIME.
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'application/zip', 'video/mp4', 'audio/mpeg',
        'application/octet-stream'
    ];

    const allowedExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx',
        '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.zip', '.mp4', '.mp3'
    ];
    const fileExtension = path.extname(file.originalname || '').toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type (${file.mimetype || 'unknown'}). Allowed types: images, PDF, Word, Excel, PowerPoint, text, zip, video, audio.`), false);
    }
};

const createUpload = (maxFileSizeMB = null) => {
    const uploadConfig = {
        storage: storage,
        fileFilter: fileFilter
    };

    if (typeof maxFileSizeMB === 'number' && maxFileSizeMB > 0) {
        uploadConfig.limits = {
            fileSize: maxFileSizeMB * 1024 * 1024
        };
    }

    return multer(uploadConfig);
};

const upload = createUpload();
const researchUpload = createUpload(10);
const instructionalUpload = createUpload(10);

module.exports = upload;
module.exports.createUpload = createUpload;
module.exports.researchUpload = researchUpload;
module.exports.instructionalUpload = instructionalUpload;