const fs = require('node:fs/promises');
const path = require('node:path');
const { storageDirectory } = require('../config/storage');

const documents = new Map();

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner
  };
}

function getStoredPath(fileName) {
  const filePath = path.resolve(storageDirectory, fileName);
  if (path.dirname(filePath) !== storageDirectory) {
    throw new Error('Nome de arquivo armazenado inválido.');
  }
  return filePath;
}

function create(file, owner) {
  const id = file.filename;
  const originalName = path.basename(file.originalname.replace(/\\/g, '/')) || 'document';
  const document = {
    id,
    originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    fileName: file.filename
  };

  documents.set(id, document);
  return toPublicDocument(document);
}

function listByOwner(owner) {
  return Array.from(documents.values())
    .filter((document) => document.owner === owner)
    .map(toPublicDocument);
}

function findDownloadByOwner(id, owner) {
  const document = documents.get(id);
  if (!document || document.owner !== owner) {
    return null;
  }

  return {
    filePath: getStoredPath(document.fileName),
    originalName: document.originalName
  };
}

async function removeStoredFile(fileName) {
  try {
    await fs.unlink(getStoredPath(fileName));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = { create, findDownloadByOwner, listByOwner, removeStoredFile };