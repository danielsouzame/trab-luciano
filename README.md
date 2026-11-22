# Desafio prático — Estoque Fácil

## Contexto
Você recebeu um pequeno sistema de controle de estoque desenvolvido com React, Vite, React Router e JSON Server. O sistema foi entregue com falhas intencionais. Sua missão é investigar, corrigir e validar o funcionamento da aplicação.

**Importante:** não reescreva o projeto do zero. Preserve a estrutura e corrija os problemas encontrados.

## Objetivo
Entregar uma aplicação funcional que permita:
- Listar os produtos cadastrados (GET).
- Cadastrar um produto (POST).
- Editar um produto existente (PUT).
- Excluir um produto (DELETE).
- Navegar entre listagem, cadastro e edição usando React Router.

## Tecnologias
- React 18
- Vite
- React Router DOM 6
- JSON Server 0.17

## Como executar

Pré-requisito: Node.js instalado.

Abra dois terminais na pasta do projeto.

**Terminal 1 — API mockada**
```bash
npm install
npm run server
```
A API ficará disponível em `http://localhost:3001`.

**Terminal 2 — aplicação React**
```bash
npm run dev
```
Acesse o endereço informado pelo Vite (normalmente `http://localhost:5173`).

Para verificar os dados diretamente, acesse `http://localhost:3001/products`.

## Regras esperadas
1. O produto deve possuir `name`, `category`, `price` e `quantity`.
2. Nome e categoria não podem ficar vazios.
3. Preço e quantidade devem ser valores numéricos não negativos.
4. Após cadastrar, editar ou excluir, a interface deve refletir a alteração.
5. Ao abrir a edição, os dados atuais do produto devem aparecer no formulário.
6. Exibir mensagens compreensíveis em situações de erro.
7. Não deve ser possível excluir um produto sem confirmação.

## Entrega do aluno

Entregue:

### 1. Projeto corrigido
- Código-fonte completo.
- Aplicação executando localmente.
- Os quatro métodos HTTP funcionando.
- Não incluir `node_modules` na entrega.

### 2. Relatório de depuração
Para cada problema encontrado, registre:

| Campo | O que descrever |
|---|---|
| Arquivo/local | Onde estava o problema |
| Sintoma | O que acontecia na aplicação |
| Causa | Por que acontecia |
| Diagnóstico | Como você investigou (console, Network, terminal etc.) |
| Correção | O que foi alterado |
| Validação | Como comprovou que resolveu |

Inclua também:
- Prints ou evidências do sistema funcionando.
- Pelo menos uma evidência da aba Network mostrando uma requisição HTTP.
- Uma breve reflexão: qual erro foi mais difícil de encontrar e por quê?

## Critérios de aceite
- [ ] Listagem carrega os produtos da API.
- [ ] Cadastro persiste um novo produto no `db.json`.
- [ ] Edição persiste as alterações do produto correto.
- [ ] Exclusão remove o produto correto.
- [ ] Formulário apresenta dados ao editar.
- [ ] Validações impedem dados inválidos.
- [ ] Rotas de listagem, cadastro e edição funcionam ao atualizar o navegador.
- [ ] Relatório explica causa, correção e teste de cada falha.

## Dicas de investigação
- Comece pelo console do navegador e pelo terminal.
- Observe o status HTTP na aba Network.
- Compare a URL chamada pelo frontend com as rotas do JSON Server.
- Confira os argumentos enviados às funções de serviço.
- Verifique os valores controlados do formulário.
- Leia os avisos do React: nem todo problema aparece como erro fatal.

## Observação
As falhas foram colocadas intencionalmente para fins didáticos. O projeto inicial pode apresentar funcionalidades que não operam corretamente. A solução deve ser construída por investigação, não por tentativa aleatória.