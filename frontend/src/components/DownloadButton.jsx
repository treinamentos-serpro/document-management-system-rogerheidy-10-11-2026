import { useState } from 'react';
import { downloadDocument } from '../services/documentsApi.js';

export default function DownloadButton({ document, userId }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setIsDownloading(true);
    setError('');
    try {
      await downloadDocument(document, userId);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="download-control">
      <button
        aria-label={`Baixar ${document.originalName}`}
        className="download-button"
        disabled={isDownloading}
        onClick={handleDownload}
        type="button"
      >
        {isDownloading ? 'Baixando...' : 'Baixar'}
        {!isDownloading && <span aria-hidden="true">↓</span>}
      </button>
      {error && <span className="download-error" role="alert">{error}</span>}
    </div>
  );
}