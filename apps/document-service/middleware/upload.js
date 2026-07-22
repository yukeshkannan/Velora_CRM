const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

let s3Client = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    try {
        s3Client = new S3Client({
            region: process.env.AWS_REGION || 'ap-south-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
        });
    } catch (err) {
        console.warn('[Document-Service] AWS S3 Initialization Warning:', err.message);
    }
}

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

let s3Storage = null;
if (s3Client) {
    try {
        s3Storage = multerS3({
            s3: s3Client,
            bucket: process.env.AWS_BUCKET_NAME || 'company-crm-uploads',
            metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
            key: (req, file, cb) => cb(null, `documents/${Date.now()}-${file.originalname}`)
        });
    } catch (err) {
        console.warn('[Document-Service] S3 Storage Config Warning:', err.message);
    }
}

const selectedStorage = (process.env.STORAGE_TYPE === 's3' && s3Storage) ? s3Storage : diskStorage;

const fileFilter = (req, file, cb) => {
    const isAllowed = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
    if (isAllowed) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type. Only Images and PDFs are allowed.'), false);
    }
};

const upload = multer({ 
    storage: selectedStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

module.exports = upload;

