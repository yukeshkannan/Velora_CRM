const path = require('path');
const fs = require('fs');

// @desc    Upload a file
// @route   POST /api/documents/upload
// @access  Public
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
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '../uploads', filename);

    if (fs.existsSync(filepath)) {
        res.sendFile(filepath);
    } else {
        res.status(404).json({ success: false, message: 'File not found' });
    }
};
