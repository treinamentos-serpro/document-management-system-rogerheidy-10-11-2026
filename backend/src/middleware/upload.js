const { randomUUID } = require('node:crypto');
const multer = require('multer');
const { maxFileSizeBytes, storageDirectory } = require('../config/storage');

const storage = multer.diskStorage({
  destination: storageDirectory,
  filename: (req, file, callback) => callback(null, randomUUID())
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeBytes, files: 1 }
});

module.exports = upload;