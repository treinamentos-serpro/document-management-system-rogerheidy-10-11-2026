const documentsService = require('../services/documents.service');

function requireOwner(req, res, next) {
  const owner = req.get('X-User-Id');
  if (!owner || !owner.trim()) {
    return res.status(400).json({
      error: {
        code: 'INVALID_USER',
        message: 'O cabeçalho X-User-Id é obrigatório.'
      }
    });
  }

  req.owner = owner.trim();
  return next();
}

async function upload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      error: {
        code: 'FILE_REQUIRED',
        message: 'Envie um arquivo no campo file.'
      }
    });
  }

  try {
    const document = await documentsService.upload(req.file, req.owner);
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

function list(req, res, next) {
  try {
    return res.status(200).json({ documents: documentsService.list(req.owner) });
  } catch (error) {
    return next(error);
  }
}

function download(req, res, next) {
  let document;
  try {
    document = documentsService.getDownload(req.params.id, req.owner);
  } catch (error) {
    return next(error);
  }

  if (!document) {
    return res.status(404).json({
      error: {
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Documento não encontrado.'
      }
    });
  }

  return res.download(document.filePath, document.originalName, (error) => {
    if (!error) {
      return;
    }
    if (res.headersSent) {
      return next(error);
    }
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Documento não encontrado.'
        }
      });
    }
    return next(error);
  });
}

module.exports = { download, list, requireOwner, upload };