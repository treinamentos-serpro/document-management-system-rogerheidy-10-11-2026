import DownloadButton from './DownloadButton.jsx';
import formatFileSize from './formatFileSize.js';

function formatUploadDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function getFileExtension(fileName) {
  const extension = fileName.split('.').pop();
  return extension && extension !== fileName ? extension.slice(0, 4).toUpperCase() : 'ARQ';
}

export default function DocumentList({ documents, error, isLoading, onRefresh, userId }) {
  if (isLoading) {
    return <p className="list-message" role="status">Carregando documentos...</p>;
  }

  if (error) {
    return (
      <div className="list-message list-message--error" role="alert">
        <p>{error}</p>
        <button className="text-button" onClick={onRefresh} type="button">Tentar novamente</button>
      </div>
    );
  }

  if (!userId) {
    return <p className="list-message">Informe um identificador para consultar a biblioteca.</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-mark" aria-hidden="true">—</span>
        <h3>Nenhum documento ainda</h3>
        <p>Os arquivos enviados para este usuário aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li className="document-row" key={document.id}>
          <span className="file-type" aria-label={`Arquivo ${getFileExtension(document.originalName)}`}>
            {getFileExtension(document.originalName)}
          </span>
          <div className="document-details">
            <h3 title={document.originalName}>{document.originalName}</h3>
            <p>{formatFileSize(document.size)} <span aria-hidden="true">·</span> {formatUploadDate(document.uploadedAt)}</p>
          </div>
          <DownloadButton document={document} userId={userId} />
        </li>
      ))}
    </ul>
  );
}