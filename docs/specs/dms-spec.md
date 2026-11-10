# Especificação — Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos, armazenando os arquivos no filesystem local e mantendo os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Enviar um documento e associá-lo a um usuário.
- Listar os documentos do usuário informado na requisição.
- Baixar um documento pelo identificador, respeitando a associação ao usuário.
- Exibir estados de carregamento, sucesso e erro nas operações da interface.
- Configurar porta, diretório de armazenamento e limite de upload por variáveis de ambiente.

### Fora do escopo

- Armazenamento em nuvem ou em serviços externos.
- Persistência dos metadados em banco de dados ou em disco.
- Autenticação, cadastro de usuários e recuperação de senha.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Pesquisa, classificação ou organização em pastas.
- Validação de conteúdo por antivírus ou inspeção especializada.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo usando o formulário de upload. |
| RF-02 | O sistema associa o documento ao usuário informado na requisição. |
| RF-03 | O sistema armazena o arquivo no filesystem local usando `multer` com `diskStorage`. |
| RF-04 | O sistema gera um identificador único para cada documento. |
| RF-05 | O sistema registra os metadados do documento em memória após o armazenamento do arquivo. |
| RF-06 | O usuário pode listar somente os documentos associados ao identificador de usuário da requisição. |
| RF-07 | O usuário pode baixar um documento pelo identificador, desde que ele pertença ao usuário informado. |
| RF-08 | O sistema retorna erro apropriado quando o arquivo, o usuário ou o documento não forem válidos ou encontrados. |
| RF-09 | A interface permite selecionar e enviar um arquivo e informa o resultado da operação. |
| RF-10 | A interface apresenta os documentos do usuário e permite iniciar o download de cada documento. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados localmente com `multer` e `diskStorage`; não usar armazenamento externo. |
| RNF-02 | Os metadados devem permanecer em memória durante a execução do processo. |
| RNF-03 | Os metadados em memória não são preservados após reiniciar o backend; essa limitação deve ser documentada. |
| RNF-04 | O diretório de armazenamento deve ser configurável e, por padrão, corresponder a `backend/storage`. |
| RNF-05 | O limite máximo de upload deve ser configurável por variável de ambiente e ter um valor padrão de 10 MiB. |
| RNF-06 | A configuração operacional deve ser feita por variáveis de ambiente, incluindo a porta do backend. |
| RNF-07 | O nome original do arquivo não deve ser usado como nome físico de armazenamento. O nome físico deve ser gerado pelo sistema. |
| RNF-08 | Os nomes de arquivo retornados no download devem ser tratados como dados de entrada e não podem permitir traversal de diretório ou injeção de cabeçalhos. |
| RNF-09 | A API deve responder com códigos HTTP coerentes e mensagens de erro que não exponham caminhos locais nem detalhes internos. |
| RNF-10 | O frontend deve acessar o backend via prefixo `/api`, usando o proxy do Vite no desenvolvimento. |

## 5. Identidade e propriedade dos documentos

A autenticação está fora do escopo desta versão. Para permitir a separação de documentos por usuário, as requisições da API devem incluir o cabeçalho `X-User-Id`.

O backend deve validar que o cabeçalho esteja presente e não seja vazio. O valor será tratado como identificador opaco do usuário e armazenado no campo `owner`.

**Limitação de segurança:** `X-User-Id` identifica o usuário, mas não comprova sua identidade. A API não deve ser exposta a clientes não confiáveis sem uma camada de autenticação confiável que determine ou valide esse valor. Uma versão futura deverá obter o proprietário a partir de uma identidade autenticada, em vez de confiar diretamente no cabeçalho enviado pelo cliente.

## 6. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único, gerado pelo backend. |
| `originalName` | string | Nome original informado para o arquivo enviado. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601, UTC. |
| `owner` | string | Identificador do usuário proprietário. |

Exemplo:

```json
{
  "id": "8fd47f5d-10db-43b1-a29c-27f7b57918d4",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-11-10T12:30:00.000Z",
  "owner": "usuario-123"
}
```

### Dados internos de persistência

Além dos metadados públicos, o repositório mantém internamente a referência ao arquivo armazenado, incluindo o nome físico gerado pelo backend. Esses dados não devem ser incluídos nas respostas da API.

Os registros de metadados devem ser indexados pelo `id` em memória. Arquivos cujo metadata não possa ser registrado após o upload devem ser removidos do filesystem para evitar arquivos órfãos.

## 7. Contratos de API

As rotas do backend são descritas sem prefixo. No frontend, elas serão acessadas com `/api`, conforme o proxy do Vite.

### Cabeçalho comum

As operações de usuário exigem:

```http
X-User-Id: usuario-123
```

### `POST /upload`

Envia um arquivo para o usuário indicado.

**Entrada**

- `Content-Type: multipart/form-data`
- Campo obrigatório: `file`
- Cabeçalho obrigatório: `X-User-Id`

**Sucesso — `201 Created`**

Retorna os metadados públicos do documento:

```json
{
  "id": "8fd47f5d-10db-43b1-a29c-27f7b57918d4",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-11-10T12:30:00.000Z",
  "owner": "usuario-123"
}
```

**Erros**

- `400 Bad Request`: cabeçalho de usuário ausente/inválido ou arquivo não enviado.
- `413 Payload Too Large`: arquivo excede o limite configurado.
- `500 Internal Server Error`: falha inesperada ao armazenar o arquivo ou registrar seus metadados.

### `GET /documents`

Lista os documentos associados ao usuário informado.

**Entrada**

- Cabeçalho obrigatório: `X-User-Id`

**Sucesso — `200 OK`**

```json
{
  "documents": [
    {
      "id": "8fd47f5d-10db-43b1-a29c-27f7b57918d4",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-11-10T12:30:00.000Z",
      "owner": "usuario-123"
    }
  ]
}
```

Se o usuário ainda não tiver documentos, `documents` deve ser uma lista vazia.

**Erro**

- `400 Bad Request`: cabeçalho de usuário ausente ou inválido.

### `GET /documents/:id/download`

Retorna o conteúdo binário de um documento pertencente ao usuário informado.

**Entrada**

- Parâmetro `id`: identificador do documento.
- Cabeçalho obrigatório: `X-User-Id`

**Sucesso — `200 OK`**

- Corpo: conteúdo binário do arquivo.
- Cabeçalho `Content-Disposition`: download como anexo com o nome original tratado com segurança.
- Cabeçalho `Content-Type`: tipo do arquivo, quando disponível; caso contrário, tipo genérico de binário.

**Erros**

- `400 Bad Request`: cabeçalho de usuário ausente ou inválido.
- `404 Not Found`: documento inexistente, pertencente a outro usuário ou arquivo indisponível. O sistema não deve revelar se um documento de outro usuário existe.
- `500 Internal Server Error`: falha inesperada durante a leitura do arquivo.

### Formato de erro

Erros da API devem usar uma estrutura consistente:

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "O arquivo excede o tamanho máximo permitido."
  }
}
```

Os códigos e mensagens devem ser estáveis o suficiente para que o frontend possa apresentar feedback sem depender do texto de erros internos.

## 8. Decisões arquiteturais

### Backend

- Node.js com Express, em CommonJS.
- Seguir o fluxo `routes -> controllers -> services -> repositories`.
- `routes` mapeiam os endpoints para os controllers.
- `controllers` validam os dados básicos da requisição e formatam as respostas HTTP.
- `services` implementam as regras de upload, propriedade, listagem e download.
- `repositories` encapsulam acesso ao filesystem e aos metadados em memória.
- Utilizar `multer` com `diskStorage` para gravação local.
- Não adicionar banco de dados ou dependência de armazenamento externo nesta versão.

### Frontend

- React com Vite, em ESM.
- Organizar a interface em componentes, páginas e serviços conforme a estrutura existente.
- Centralizar chamadas à API usando `fetch`.
- Usar o prefixo `/api` nas chamadas, compatível com o proxy de desenvolvimento já configurado.
- Tratar erros de rede, upload e download e fornecer feedback visível ao usuário.

### Configuração proposta

| Variável | Finalidade | Padrão |
| --- | --- | --- |
| `PORT` | Porta HTTP do backend. | `3000` |
| `UPLOAD_DIR` | Diretório local de armazenamento. | `backend/storage` |
| `MAX_FILE_SIZE_BYTES` | Tamanho máximo de upload em bytes. | `10485760` |

O diretório configurado deve ser resolvido de forma previsível e criado quando necessário. Segredos não devem ser registrados em logs.

## 9. Plano de execução

Este plano descreve etapas futuras de implementação; nenhuma delas faz parte da criação desta especificação. Nesta etapa, o único artefato previsto é `docs/specs/dms-spec.md`.

1. **Estabelecer contratos e configuração.** Definir a configuração do backend, validação do usuário e tratamento comum de erros. **Critério de aceite:** configuração documentada e entradas inválidas rejeitadas consistentemente.
2. **Implementar persistência local e upload.** Configurar `multer` com `diskStorage`, gerar nomes físicos seguros e registrar metadados em memória. **Critério de aceite:** upload válido retorna `201` com metadados; ausência de arquivo e excesso de tamanho retornam erros previstos; falha ao registrar metadados não deixa arquivo órfão.
3. **Implementar listagem e download.** Restringir consultas e downloads ao proprietário indicado. **Critério de aceite:** listagem retorna somente documentos do usuário; documento inexistente ou de outro usuário retorna `404`; download transmite o arquivo com nome seguro.
4. **Construir a interface do usuário.** Implementar seleção e envio de arquivo, listagem e ações de download, incluindo estados de erro e carregamento. **Critério de aceite:** as operações da interface usam os contratos definidos e exibem os resultados sem expor erros internos.
5. **Verificar integração e limites operacionais.** Testar os fluxos da API e da interface, incluindo limite de tamanho, isolamento por usuário e comportamento após reinício. **Critério de aceite:** fluxos essenciais atendem aos requisitos; a perda de metadados após reinício e a limitação de identidade estão documentadas.

## 10. Riscos e limitações conhecidos

- Os metadados em memória são perdidos ao reiniciar o backend; os arquivos físicos podem permanecer sem referência.
- O cabeçalho `X-User-Id` não é autenticação e não deve ser considerado confiável fora de um ambiente protegido.
- O armazenamento local depende do filesystem e do espaço disponível na máquina que executa o backend.
- Esta versão não define uma política de recuperação ou limpeza de arquivos órfãos além de evitar sua criação durante falhas de upload.
