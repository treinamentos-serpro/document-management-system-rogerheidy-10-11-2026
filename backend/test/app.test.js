const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
const previousUploadDirectory = process.env.UPLOAD_DIR;
const previousMaxFileSize = process.env.MAX_FILE_SIZE_BYTES;
process.env.UPLOAD_DIR = storageDirectory;
process.env.MAX_FILE_SIZE_BYTES = '8';

const app = require('../src/app');
const documentsRepository = require('../src/repositories/documents.repository');
const documentsService = require('../src/services/documents.service');
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  fs.rmSync(storageDirectory, { recursive: true, force: true });

  if (previousUploadDirectory === undefined) {
    delete process.env.UPLOAD_DIR;
  } else {
    process.env.UPLOAD_DIR = previousUploadDirectory;
  }
  if (previousMaxFileSize === undefined) {
    delete process.env.MAX_FILE_SIZE_BYTES;
  } else {
    process.env.MAX_FILE_SIZE_BYTES = previousMaxFileSize;
  }
});

test('upload, listagem e download respeitam os contratos e o proprietário', async () => {
  const form = new FormData();
  form.append('file', new Blob(['hello']), 'hello.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-a' },
    body: form
  });

  assert.equal(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.deepEqual(Object.keys(document), [
    'id', 'originalName', 'size', 'uploadedAt', 'owner'
  ]);
  assert.equal(document.originalName, 'hello.txt');
  assert.equal(document.size, 5);
  assert.equal(document.owner, 'user-a');

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'user-a' }
  });
  assert.equal(listResponse.status, 200);
  assert.deepEqual((await listResponse.json()).documents, [document]);

  const otherUserList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'user-b' }
  });
  assert.deepEqual((await otherUserList.json()).documents, []);

  const deniedDownload = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'user-b' } }
  );
  assert.equal(deniedDownload.status, 404);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'user-a' } }
  );
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /hello\.txt/);
  assert.equal(await downloadResponse.text(), 'hello');
});

test('upload valida usuário, arquivo e limite de tamanho', async () => {
  const missingOwnerForm = new FormData();
  missingOwnerForm.append('file', new Blob(['ok']), 'ok.txt');
  const missingOwnerResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: missingOwnerForm
  });
  assert.equal(missingOwnerResponse.status, 400);
  assert.equal((await missingOwnerResponse.json()).error.code, 'INVALID_USER');

  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-a' },
    body: new FormData()
  });
  assert.equal(missingFileResponse.status, 400);
  assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

  const oversizedForm = new FormData();
  oversizedForm.append('file', new Blob(['123456789']), 'large.txt');
  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-a' },
    body: oversizedForm
  });
  assert.equal(oversizedResponse.status, 413);
  assert.equal((await oversizedResponse.json()).error.code, 'FILE_TOO_LARGE');
});

test('limpa o arquivo e preserva o erro quando a persistência rejeita', async () => {
  const originalCreate = documentsRepository.create;
  const originalRemoveStoredFile = documentsRepository.removeStoredFile;
  const persistenceError = new Error('Falha ao persistir metadados.');
  const removedFiles = [];

  documentsRepository.create = async () => {
    throw persistenceError;
  };
  documentsRepository.removeStoredFile = async (fileName) => {
    removedFiles.push(fileName);
  };

  try {
    await assert.rejects(
      documentsService.upload({ filename: 'incomplete-upload' }, 'user-a'),
      (error) => error === persistenceError
    );
    assert.deepEqual(removedFiles, ['incomplete-upload']);
  } finally {
    documentsRepository.create = originalCreate;
    documentsRepository.removeStoredFile = originalRemoveStoredFile;
  }
});

test('listagem e download exigem identificação do usuário', async () => {
  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 400);
  assert.equal((await listResponse.json()).error.code, 'INVALID_USER');

  const downloadResponse = await fetch(`${baseUrl}/documents/document-id/download`);
  assert.equal(downloadResponse.status, 400);
  assert.equal((await downloadResponse.json()).error.code, 'INVALID_USER');
});
