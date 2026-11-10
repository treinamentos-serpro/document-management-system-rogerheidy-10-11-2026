const documentsRepository = require('../repositories/documents.repository');

async function cleanupFailedUpload(fileName) {
  try {
    await documentsRepository.removeStoredFile(fileName);
  } catch (cleanupError) {
    console.error('Não foi possível remover um upload incompleto:', cleanupError);
  }
}

async function upload(file, owner) {
  try {
    return await documentsRepository.create(file, owner);
  } catch (error) {
    await cleanupFailedUpload(file.filename);
    throw error;
  }
}

function list(owner) {
  return documentsRepository.listByOwner(owner);
}

function getDownload(id, owner) {
  return documentsRepository.findDownloadByOwner(id, owner);
}

module.exports = { getDownload, list, upload };