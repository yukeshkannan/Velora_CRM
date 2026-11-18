const path = require('path');
const fs = require('fs');

const uploadsDir = path.resolve(__dirname, '../uploads');

// Ensure uploads directory exists on boot
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Upload a file
// @route   POST /api/documents/upload
// @access  Authenticated
exports.uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = req.file.location || `/api/documents/${req.file.filename}`;

    res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
            filename: req.file.key || req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: fileUrl
        }
    });
};

// @desc    Get/Download a file
// @route   GET /api/documents/:filename
// @access  Public
exports.getFile = (req, res) => {
    const rawFilename = req.params.filename;
    if (!rawFilename) {
        return res.status(400).json({ success: false, message: 'Filename is required' });
    }

    // Path traversal defense: strip any directory traversal segments
    const safeFilename = path.basename(rawFilename);
    const filepath = path.resolve(uploadsDir, safeFilename);

    // Ensure resolved path is strictly within the uploads directory
    if (!filepath.startsWith(uploadsDir)) {
        return res.status(403).json({ success: false, message: 'Access denied: Invalid file path' });
    }

    if (fs.existsSync(filepath)) {
        res.sendFile(filepath);
    } else {
        res.status(404).json({ success: false, message: 'File not found' });
    }
};
