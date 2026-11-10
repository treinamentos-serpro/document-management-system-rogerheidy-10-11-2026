import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { getDocuments } from './services/documentsApi.js';
import './App.css';

export default function App() {
  const [userId, setUserId] = useState(
    () => window.localStorage.getItem('dms-user-id') || 'usuario-local'
  );
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const activeUserId = userId.trim();

  useEffect(() => {
    window.localStorage.setItem('dms-user-id', userId);
  }, [userId]);

  useEffect(() => {
    let isCurrent = true;

    if (!activeUserId) {
      setDocuments([]);
      setListError('');
      setIsLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    setIsLoading(true);
    setListError('');

    getDocuments(activeUserId)
      .then((result) => {
        if (isCurrent) setDocuments(result.documents);
      })
      .catch((error) => {
        if (isCurrent) setListError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeUserId]);

  function handleUploaded(document) {
    if (document.owner !== activeUserId) return;
    setDocuments((currentDocuments) => [
      document,
      ...currentDocuments.filter((item) => item.id !== document.id)
    ]);
  }

  async function handleRefresh() {
    if (!activeUserId) return;
    setIsLoading(true);
    setListError('');
    try {
      const result = await getDocuments(activeUserId);
      setDocuments(result.documents);
    } catch (error) {
      setListError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>DMS <span className="brand-divider">/</span> ARQUIVO LOCAL</span>
        </a>
        <label className="user-field">
          <span className="user-field-label">Identificador do usuário</span>
          <input
            autoComplete="off"
            maxLength={128}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Ex.: usuario-123"
            value={userId}
          />
        </label>
      </header>

      <section className="page-heading" id="inicio">
        <div>
          <p className="eyebrow">ESPAÇO DE TRABALHO</p>
          <h1>Seus documentos<span className="heading-period">.</span></h1>
          <p className="page-intro">Envie, encontre e acesse seus arquivos em um só lugar.</p>
        </div>
        <div className="document-total" aria-live="polite">
          <span className="total-number">{documents.length.toString().padStart(2, '0')}</span>
          <span className="total-label">{documents.length === 1 ? 'documento' : 'documentos'}</span>
        </div>
      </section>

      <div className="workspace-grid">
        <section className="upload-panel" aria-labelledby="upload-heading">
          <div className="section-heading">
            <span className="section-index">01</span>
            <h2 id="upload-heading">Adicionar arquivo</h2>
          </div>
          <UploadComponent userId={activeUserId} onUploaded={handleUploaded} />
          <p className="storage-note">
            <span className="storage-dot" aria-hidden="true" />
            Arquivos armazenados neste servidor · até 10 MiB
          </p>
        </section>

        <section className="documents-panel" aria-labelledby="documents-heading">
          <div className="section-heading documents-heading">
            <div className="heading-title-group">
              <span className="section-index">02</span>
              <h2 id="documents-heading">Biblioteca</h2>
            </div>
            <button
              className="refresh-button"
              disabled={isLoading || !activeUserId}
              onClick={handleRefresh}
              type="button"
            >
              <span aria-hidden="true">↻</span> Atualizar
            </button>
          </div>
          <DocumentList
            documents={documents}
            error={listError}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            userId={activeUserId}
          />
        </section>
      </div>

      <footer className="page-footer">
        <span>DMS <span aria-hidden="true">·</span> GESTÃO LOCAL DE DOCUMENTOS</span>
        <span>Os metadados permanecem disponíveis enquanto o servidor estiver ativo.</span>
      </footer>
    </main>
  );
}
