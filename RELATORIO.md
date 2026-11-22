# Relatório de depuração: Estoque Fácil

Este relatório documenta os problemas encontrados na aplicação **Estoque Fácil** (React 18 + Vite + React Router 6 + JSON Server 0.17), como cada um foi investigado e corrigido, e as evidências de que a aplicação passou a funcionar.

A estrutura original do projeto foi mantida, como pede o README. As alterações ficaram restritas a `vite.config.js`, `src/main.jsx`, `src/services/productService.js`, `src/pages/ProductList.jsx` e `src/pages/ProductForm.jsx`.

## Resumo

| # | Arquivo | Problema | Gravidade |
|---|---|---|---|
| 1 | `vite.config.js` | Plugin do React registrado sem ser executado (`react` em vez de `react()`), causando tela branca | Crítica |
| 2 | `src/services/productService.js` | Listagem chamava `/product` (singular) e recebia 404 | Crítica |
| 3 | `src/pages/ProductList.jsx` | Exclusão chamava `deleteProduct()` sem o `id`, gerando `DELETE /products/undefined` | Alta |
| 4 | `src/pages/ProductForm.jsx` | Efeito com dependências vazias: dados da edição "vazavam" para o cadastro (risco de duplicar produto) | Alta |
| 5 | `src/pages/ProductForm.jsx` | Nenhuma validação: era possível salvar produto sem nome, sem categoria e com preço/quantidade inválidos | Alta |
| 6 | `src/main.jsx` | Avisos do React Router no console (future flags da v7) | Baixa (melhoria) |

Também foi investigado um ponto que **não** precisou de correção (ver [Ponto investigado sem alteração](#ponto-investigado-sem-alteração)).

## Ambiente de teste

- Node.js 22.13.1, npm 10.9.2, Windows 11.
- Terminal 1: `npm run server` (JSON Server em `http://localhost:3001`).
- Terminal 2: `npm run dev` (Vite em `http://localhost:5173`).
- Ferramentas de diagnóstico: console do navegador, aba Network, log do JSON Server no terminal, `curl` e leitura do código-fonte das dependências em `node_modules`.

---

## Problema 1: tela branca (plugin do React não executado)

| Campo | Descrição |
|---|---|
| **Arquivo/local** | `vite.config.js`, linha 5 |
| **Sintoma** | Ao abrir `http://localhost:5173`, a página ficava totalmente em branco. Nada era renderizado (evidência: `docs/evidencias/00-antes-tela-branca.jpg`). |
| **Causa** | A configuração tinha `plugins: [react]`, passando a **função** do plugin em vez do **resultado** da chamada `react()`. O Vite ignorou o plugin, e o JSX passou a ser transformado pelo esbuild no modo clássico (`React.createElement(...)`). Como `App.jsx` e as páginas não importam `React` (o projeto foi escrito para o JSX automático do `@vitejs/plugin-react`), a variável `React` não existia em tempo de execução. |
| **Diagnóstico** | 1) O console do navegador mostrava `Uncaught ReferenceError: React is not defined at App (App.jsx:6:3)`. 2) Requisitei o arquivo transformado pelo Vite (`curl http://localhost:5173/src/App.jsx`) e confirmei que o código gerado usava `React.createElement` sem nenhum `import React`. 3) Com isso a suspeita recaiu sobre a configuração do JSX, e a leitura do `vite.config.js` mostrou o plugin sem os parênteses. |
| **Correção** | `plugins: [react]` foi trocado por `plugins: [react()]`. |
| **Validação** | Recarreguei a página: o layout (cabeçalho, menu e tabela) passou a aparecer e o erro sumiu do console. O código servido pelo Vite passou a usar o runtime automático (`jsx-dev-runtime`). `npm run build` também conclui sem erros. |

```diff
 export default defineConfig({
-  plugins: [react],
+  plugins: [react()],
 })
```

## Problema 2: listagem não carregava (URL errada no GET)

| Campo | Descrição |
|---|---|
| **Arquivo/local** | `src/services/productService.js`, função `getProducts` |
| **Sintoma** | Depois de corrigir o problema 1, a tela de produtos abria com a mensagem *"Não foi possível carregar os produtos."* e a tabela vazia (*"Nenhum produto encontrado"*, *"0 produto(s) no catálogo"*). Evidência: `docs/evidencias/01-antes-erro-listagem.jpg`. |
| **Causa** | O frontend chamava `GET http://localhost:3001/product` (singular), mas o JSON Server só expõe o recurso `products` (plural), que é a chave existente no `db.json`. |
| **Diagnóstico** | 1) Na aba Network: `GET http://localhost:3001/product → 404 Not Found`. 2) O terminal do JSON Server registrava `GET /product 404`. Ao iniciar, ele lista os recursos disponíveis e só aparece `http://localhost:3001/products`. 3) Teste direto com `curl`: `/product` retorna 404 e `/products` retorna 200 com os 4 produtos. |
| **Correção** | A URL passou a ser `${API_URL}/products`, igual às demais funções do serviço. |
| **Validação** | A listagem passou a exibir os 4 produtos do `db.json`. A Network mostra `GET /products → 200 OK`. Evidência: `docs/evidencias/02-listagem.jpg`. |

```diff
 export async function getProducts() {
-  const response = await fetch(`${API_URL}/product`)
+  const response = await fetch(`${API_URL}/products`)
```

## Problema 3: exclusão falhava (id não enviado)

| Campo | Descrição |
|---|---|
| **Arquivo/local** | `src/pages/ProductList.jsx`, função `handleDelete` |
| **Sintoma** | Ao clicar em **Excluir** e confirmar, aparecia o alerta *"Não foi possível excluir o produto."* e nada era removido do `db.json`. |
| **Causa** | `handleDelete(id)` recebia o `id` corretamente, mas chamava `deleteProduct()` **sem argumentos**. Dentro do serviço, `id` ficava `undefined` e a URL virava `/products/undefined`. |
| **Diagnóstico** | 1) Na aba Network: `DELETE http://localhost:3001/products/undefined → 404 Not Found`. O `undefined` na URL indicou que o problema estava no argumento, não na rota. 2) O log do JSON Server confirmava `DELETE /products/undefined 404`. 3) Conferindo os argumentos passados às funções de serviço (dica do README), achei a chamada sem o `id`. |
| **Correção** | A chamada passou a ser `deleteProduct(id)`. |
| **Validação** | Com a confirmação **cancelada**, nenhuma requisição é feita e a lista continua igual (regra 7). Com a confirmação **aceita**, a Network mostra `DELETE /products/5 → 200 OK`, a linha some da tabela e o registro sai do `db.json`. Os outros produtos não são afetados. |

```diff
-      await deleteProduct()
+      await deleteProduct(id)
```

## Problema 4: dados da edição apareciam no cadastro (efeito sem dependências)

| Campo | Descrição |
|---|---|
| **Arquivo/local** | `src/pages/ProductForm.jsx`, `useEffect` que carrega o produto |
| **Sintoma** | Estando em **Editar produto** (ex.: `/products/2/edit`) e clicando em **Cadastrar produto** no menu, o título mudava para *"Novo produto"*, mas o formulário continuava preenchido com os dados do produto 2. Ao clicar em "Cadastrar produto", um **novo** produto duplicado era criado via POST. O inverso (voltar do cadastro para a edição com o botão Voltar) também deixava o formulário desatualizado. |
| **Causa** | As rotas `/products/new` e `/products/:id/edit` renderizam o mesmo componente `<ProductForm />` na mesma posição da árvore. O React **reaproveita a instância** (e o estado) quando só a rota muda. O `useEffect` tinha a lista de dependências vazia (`[]`), então rodava apenas na montagem: ao mudar o `id` da URL, o formulário não era limpo nem recarregado. |
| **Diagnóstico** | Esse problema não gera erro nem aviso no console. Encontrei ao testar a navegação entre as telas: inspecionei os valores dos `<input>` antes e depois de clicar em "Cadastrar produto" e eles eram idênticos (`["Mouse sem fio", "Periféricos", "89.9", "25"]`), mesmo com o título "Novo produto". Isso levou ao `useEffect` com `[]` e, consequentemente, à regra de reaproveitamento de componentes do React. |
| **Correção** | O efeito passou a depender de `[id, isEditing]`. No modo cadastro ele limpa o formulário (`initialForm`) e o erro. No modo edição ele recarrega o produto da API. Foram incluídos também uma flag `ignore` (descarta respostas de requisições antigas se o usuário trocar de rota antes de a resposta chegar) e `?? ''` nos campos, para que um campo ausente na API não transforme um input controlado em não controlado (o que geraria aviso do React). |
| **Validação** | Sequência testada: abrir `/products/2/edit` (formulário preenchido) → clicar em "Cadastrar produto" (formulário **vazio**) → botão Voltar (formulário **preenchido de novo** com os dados do produto 2). Abrir diretamente `/products/1/edit` mostra os dados do Teclado mecânico (regra 5). Evidência: `docs/evidencias/05-edicao-formulario-preenchido.jpg`. |

```diff
-  useEffect(() => {
-    if (!isEditing) return
-    async function loadProduct() { ... }
-    loadProduct()
-  }, [])
+  useEffect(() => {
+    setError('')
+    if (!isEditing) {
+      setForm(initialForm)
+      setLoading(false)
+      return
+    }
+    let ignore = false
+    setLoading(true)
+    async function loadProduct() { ... /* só atualiza o estado se !ignore */ }
+    loadProduct()
+    return () => { ignore = true }
+  }, [id, isEditing])
```

## Problema 5: formulário sem validação

| Campo | Descrição |
|---|---|
| **Arquivo/local** | `src/pages/ProductForm.jsx`, função `handleSubmit` |
| **Sintoma** | Clicar em **Cadastrar produto** com o formulário vazio salvava um produto sem nome, sem categoria, com preço 0 e quantidade 0. Isso viola as regras 2 e 3 do README. |
| **Causa** | `handleSubmit` convertia os campos com `Number(...)` e enviava direto para a API, sem verificar nada. Como `Number('')` resulta em `0`, campos numéricos vazios viravam zero silenciosamente. Os atributos `min="0"` dos inputs não bastavam: os campos não eram obrigatórios e a validação nativa não cobre nome/categoria vazios nem nomes só com espaços. |
| **Diagnóstico** | Enviei o formulário vazio e observei na aba Network um `POST /products → 201 Created`. No `db.json` apareceu o registro `{ "name": "", "category": "", "price": 0, "quantity": 0, "id": 5 }`, que depois foi removido. |
| **Correção** | Criada a função `validateForm`, executada antes de qualquer requisição. Ela exige nome e categoria não vazios (desconsiderando espaços), preço numérico e `>= 0`, e quantidade inteira e `>= 0`. Para cada caso há uma mensagem clara em português, exibida no alerta vermelho já existente (regra 6). Nome e categoria são salvos com `trim()`. O `<form>` recebeu `noValidate` para que as mensagens exibidas sejam sempre as da aplicação, e não os balões nativos do navegador, que variam conforme o idioma e cobrem só parte dos casos. |
| **Validação** | Casos testados, nenhum gerou requisição à API: formulário vazio → *"Informe o nome do produto."*; nome só com espaços → mesma mensagem; sem categoria → *"Informe a categoria do produto."*; preço `-10` → *"O preço deve ser um número maior ou igual a zero."*; quantidade `1.5` ou `-1` → *"A quantidade deve ser um número inteiro maior ou igual a zero."*. Com dados válidos (Headset Gamer, Áudio, 199,90, 10), o POST retornou `201 Created` e o produto apareceu na lista com id 5. Evidências: `03-validacao.jpg` e `04-cadastro-concluido.jpg`. |

## Problema 6 (melhoria): avisos do React Router no console

| Campo | Descrição |
|---|---|
| **Arquivo/local** | `src/main.jsx`, `<BrowserRouter>` |
| **Sintoma** | A cada navegação, o console exibia dois avisos (`⚠️ React Router Future Flag Warning`) sobre `v7_startTransition` e `v7_relativeSplatPath`. Esses avisos não quebram nada, mas poluem o console e dificultam enxergar avisos importantes. |
| **Causa** | O React Router 6.28 avisa sobre mudanças de comportamento que virão na v7 enquanto as flags não são habilitadas. |
| **Diagnóstico** | Leitura dos avisos no console, seguindo a dica do README de que nem todo problema aparece como erro fatal. |
| **Correção** | `<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>`. A aplicação não usa rotas splat relativas, então o comportamento não muda. |
| **Validação** | Depois de percorrer todas as telas, o console ficou sem nenhum erro ou aviso. |

---

## Ponto investigado sem alteração

**`updateProduct` envia `id` como texto.** Em `updateProduct(id, product)` o corpo é `{ ...product, id }`, e o `id` vem de `useParams()`, ou seja, é a string `"5"`, enquanto no `db.json` os ids são números. Suspeitei que o PUT gravaria o id como texto e quebraria comparações como `product.id !== id`. Li a implementação do JSON Server 0.17 (`node_modules/json-server/lib/server/router/plural.js`, que usa `replaceById` do `lodash-id`) e vi que o PUT **sempre preserva o id original** do registro, ignorando o `id` do corpo. O teste confirmou: após `PUT /products/5 → 200`, o registro continuou com `"id": 5` (numérico). Por isso o código foi mantido.

**Requisições duplicadas no log.** Cada GET aparece duas vezes no terminal e na Network em modo desenvolvimento. Isso é esperado: o `<React.StrictMode>` executa os efeitos duas vezes de propósito em desenvolvimento, para revelar efeitos sem limpeza. Não acontece no build de produção. O efeito do problema 4 já trata isso com a flag `ignore`.

---

## Critérios de aceite

| Critério | Resultado | Como foi verificado |
|---|---|---|
| Listagem carrega os produtos da API | ✅ | `GET /products → 200`, 4 produtos exibidos |
| Cadastro persiste um novo produto no `db.json` | ✅ | `POST /products → 201`, registro id 5 gravado no arquivo |
| Edição persiste as alterações do produto correto | ✅ | `PUT /products/5 → 200`, preço 199,90 → 179,90 e quantidade 10 → 8, somente no id 5 |
| Exclusão remove o produto correto | ✅ | `DELETE /products/5 → 200`, demais produtos intactos |
| Formulário apresenta dados ao editar | ✅ | `/products/1/edit` e `/products/5/edit` abrem preenchidos |
| Validações impedem dados inválidos | ✅ | 6 casos inválidos bloqueados sem requisição (problema 5) |
| Rotas funcionam ao atualizar o navegador | ✅ | Acesso direto/F5 em `/products`, `/products/new` e `/products/1/edit` (o servidor do Vite devolve o `index.html` para qualquer rota da SPA) |
| Relatório explica causa, correção e teste de cada falha | ✅ | Este documento |

Também foi verificado: um id inexistente (`/products/999/edit`) mostra *"Produto não encontrado."* (`GET /products/999 → 404`), e `npm run build` gera o build de produção sem erros.

---

## Evidências

Capturas de tela em [`docs/evidencias/`](docs/evidencias/):

| Arquivo | O que mostra |
|---|---|
| `00-antes-tela-branca.jpg` | **Antes:** tela branca causada pelo problema 1 |
| `01-antes-erro-listagem.jpg` | **Antes:** erro "Não foi possível carregar os produtos" (problema 2) |
| `02-listagem.jpg` | Listagem funcionando com os 4 produtos |
| `03-validacao.jpg` | Validação bloqueando o envio do formulário vazio |
| `04-cadastro-concluido.jpg` | Produto "Headset Gamer" cadastrado e listado |
| `05-edicao-formulario-preenchido.jpg` | Formulário de edição com os dados atuais do produto |
| `06-edicao-salva.jpg` | Lista após a edição (R$ 179,90 / 8 un.) |

### Requisições HTTP (aba Network)

Requisições capturadas pelo navegador durante os testes, antes e depois das correções (as requisições `OPTIONS` de pré-voo do CORS e os GETs duplicados do StrictMode foram omitidos):

| Método | URL | Status | Situação |
|---|---|---|---|
| GET | `http://localhost:3001/product` | **404 Not Found** | Antes (problema 2) |
| DELETE | `http://localhost:3001/products/undefined` | **404 Not Found** | Antes (problema 3) |
| POST | `http://localhost:3001/products` | 201 Created | Antes: produto vazio salvo (problema 5) |
| GET | `http://localhost:3001/products` | 200 OK | Depois |
| POST | `http://localhost:3001/products` | 201 Created | Depois: cadastro válido |
| GET | `http://localhost:3001/products/5` | 200 OK | Depois: carregar edição |
| PUT | `http://localhost:3001/products/5` | 200 OK | Depois: salvar edição |
| DELETE | `http://localhost:3001/products/5` | 200 OK | Depois: exclusão |
| GET | `http://localhost:3001/products/999` | 404 Not Found | Depois: id inexistente tratado com mensagem |

O log completo do terminal do JSON Server durante os testes está em [`docs/evidencias/json-server-log.txt`](docs/evidencias/json-server-log.txt).

> **Print da aba Network:** adicionar aqui uma captura do DevTools (F12 → Network) mostrando uma das requisições acima, por exemplo o `PUT /products/:id → 200`. Sugestão de nome: `docs/evidencias/07-network.png`.
>
> `![Aba Network](docs/evidencias/07-network.png)`

---

## Reflexão: qual erro foi mais difícil de encontrar e por quê?

O mais difícil foi o **problema 4** (dados da edição vazando para o cadastro). Todos os outros deixavam rastro: a tela branca tinha um `ReferenceError` no console, a listagem e a exclusão tinham um 404 na aba Network com a URL errada visível, e o produto vazio aparecia no `db.json`. O problema 4 não produzia erro, aviso nem requisição falha. Cada tela, aberta isoladamente (inclusive com F5), funcionava. Ele só aparecia numa sequência específica de navegação (edição → cadastro pelo menu), e o resultado ainda parecia correto à primeira vista, porque o título mudava para "Novo produto".

Para entendê-lo foi preciso juntar duas coisas: o `useEffect` com dependências vazias e o fato de o React reaproveitar a instância de um componente quando o mesmo tipo é renderizado na mesma posição, mesmo que a rota seja outra. A lição é que o console e a aba Network mostram muito, mas não mostram erros de lógica de estado. Para esses é preciso testar fluxos completos de navegação, e não só cada tela separadamente.

O problema 1 também foi interessante: o erro `React is not defined` apontava para `App.jsx`, mas a causa real estava no `vite.config.js`. Só ficou claro ao olhar o código **transformado** que o Vite entregava ao navegador, em vez do código-fonte.
