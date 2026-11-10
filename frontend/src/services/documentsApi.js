const API_PREFIX = '/api';

function userHeaders(userId) {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error('Informe um identificador de usuário para continuar.');
  }
  return { 'X-User-Id': normalizedUserId };
}

async function getErrorMessage(response) {
  try {
    const body = await response.json();
    if (body.error?.message) return body.error.message;
  } catch {
    // Respostas não JSON usam a mensagem padrão abaixo.
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
}

export function getDocuments(userId) {
  return requestJson(`${API_PREFIX}/documents`, {
    headers: userHeaders(userId)
  });
}

export function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);

  return requestJson(`${API_PREFIX}/upload`, {
    method: 'POST',
    headers: userHeaders(userId),
    body: formData
  });
}

export async function downloadDocument(document, userId) {
  const response = await fetch(
    `${API_PREFIX}/documents/${encodeURIComponent(document.id)}/download`,
    { headers: userHeaders(userId) }
  );
  if (!response.ok) throw new Error(await getErrorMessage(response));

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}