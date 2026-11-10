const documentsRepository = require('../repositories/documents.repository');

async function upload(file, owner) {
  try {
    return documentsRepository.create(file, owner);
  } catch (error) {
    try {
      await documentsRepository.removeStoredFile(file.filename);
    } catch (cleanupError) {
      console.error('Não foi possível remover um upload incompleto:', cleanupError);
    }
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