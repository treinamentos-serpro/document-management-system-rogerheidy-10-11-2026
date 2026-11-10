import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentsApi.js';
import formatFileSize from './formatFileSize.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export default function UploadComponent({ userId, onUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef(null);

  function selectFile(file) {
    setError('');
    setSuccess('');
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setError('O arquivo excede o limite de 10 MiB.');
      return;
    }
    setSelectedFile(file || null);
  }

  function handleDrop(event) {
    event.preventDefault();
    selectFile(event.dataTransfer.files[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile) {
      setError('Selecione um arquivo antes de enviar.');
      return;
    }
    if (!userId) {
      setError('Informe um identificador de usuário no cabeçalho.');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');
    try {
      const document = await uploadDocument(selectedFile, userId);
      onUploaded(document);
      setSuccess(`${document.originalName} foi enviado.`);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label
        className={`upload-zone${selectedFile ? ' upload-zone--selected' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          accept="*/*"
          className="visually-hidden"
          onChange={(event) => selectFile(event.target.files[0])}
          ref={inputRef}
          type="file"
        />
        <span className="upload-symbol" aria-hidden="true">↑</span>
        <span className="upload-prompt">
          {selectedFile ? selectedFile.name : 'Escolha um arquivo'}
        </span>
        <span className="upload-hint">
          {selectedFile ? formatFileSize(selectedFile.size) : 'ou arraste até aqui'}
        </span>
        <span className="upload-browse">Procurar arquivos</span>
      </label>

      <button className="primary-button upload-submit" disabled={isUploading} type="submit">
        {isUploading ? 'Enviando...' : 'Enviar documento'}
        {!isUploading && <span aria-hidden="true">↗</span>}
      </button>
      <div aria-live="polite" className="form-feedback">
        {error && <p className="feedback-error" role="alert">{error}</p>}
        {success && <p className="feedback-success">{success}</p>}
      </div>
    </form>
  );
}