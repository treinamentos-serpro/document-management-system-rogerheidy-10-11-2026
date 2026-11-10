const path = require('node:path');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const configuredMaxFileSize = process.env.MAX_FILE_SIZE_BYTES;
const maxFileSizeBytes = configuredMaxFileSize
  ? Number(configuredMaxFileSize)
  : DEFAULT_MAX_FILE_SIZE_BYTES;

if (!Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes <= 0) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

const storageDirectory = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, '../../storage')
);

module.exports = { maxFileSizeBytes, storageDirectory };