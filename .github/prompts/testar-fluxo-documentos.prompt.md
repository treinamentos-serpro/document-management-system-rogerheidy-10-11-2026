---
description: "Cria testes HTTP de integração para os fluxos de documentos do DMS sem depender de serviços externos."
name: testar-fluxo-documentos
argument-hint: "cenário (ex. upload, isolamento por usuário, limite de tamanho)"
agent: agent
---

# Testar fluxo de documentos

Crie ou amplie testes de integração para o cenário `${input:cenario:fluxo ou comportamento a testar}` no backend do DMS.

Antes de editar, consulte `docs/specs/dms-spec.md`, as rotas atuais e os testes existentes em `backend/test`.

Requisitos:

- Use o runner nativo `node:test`, `node:assert/strict`, `fetch`, `FormData` e `Blob` disponíveis no Node do projeto.
- Exercite a API HTTP Express e valide status, payload, cabeçalhos e conteúdo quando aplicável.
- Para uploads, configure um diretório temporário fora de `backend/storage` e remova-o ao final, inclusive em caso de falha.
- Cubra isolamento entre usuários e respostas de erro pertinentes ao cenário.
- Não use serviços externos nem adicione dependências de teste.
- Não altere código de produção para fazer o teste passar sem antes apontar a necessidade e a evidência.
- Execute `cd backend && npm test` e resuma os cenários adicionados e o resultado.
