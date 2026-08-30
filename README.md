# Origem

Novo catálogo público da **Origem**, com painel gerencial, carrinho por WhatsApp, cálculo de parcelamento e importação privada do projeto **Criar sistema de mídia para produtos**.

A aplicação foi desenhada para rodar como projeto Node.js/Next.js na Hostinger com banco MySQL/MariaDB.

## Estado atual

O repositório já contém uma primeira versão funcional com:

- catálogo responsivo, busca e filtros por marca e categoria;
- página individual de produto com galeria, descrição e especificações;
- cards com calculadora, carrinho e WhatsApp;
- carrinho persistente com cálculo de parcelamento sobre o total;
- condição escolhida incluída na mensagem enviada ao WhatsApp;
- painel protegido por senha;
- dashboard de qualidade do cadastro e histórico da última sincronização;
- edição individual de preço, promoção, período promocional, destaque e publicação;
- painel de marcas com logo importada e substituição manual;
- cadastro de máquinas, bandeiras e taxas de 1x a 24x;
- opção de absorver ou repassar a taxa ao cliente;
- informações públicas editáveis: nome, logo, WhatsApp, Instagram, endereço, mapa, horário e rodapé;
- sincronização completa e incremental com o sistema de mídia;
- contingência de custos pelo Olist Tiny usando OAuth2 com renovação automática;
- tokens do Tiny criptografados no banco;
- rota protegida para sincronização automática por cron;
- modo demonstração quando o banco ainda não foi configurado.

## Fontes de verdade

| Informação | Fonte |
|---|---|
| Nome, SKU, EAN, descrições, imagens, atributos, marca, categoria e estoque | Sistema de mídia |
| Logo da marca | Sistema de mídia, com override opcional no painel |
| Custo | Sistema de mídia; Tiny somente quando estiver ausente |
| Preço de venda e promoção | Painel Origem |
| Destaque e publicação | Painel Origem |
| Máquinas, bandeiras e taxas | Painel Origem |
| WhatsApp, Instagram e endereço | Painel Origem |

Uma sincronização nunca substitui preço, promoção, destaque ou decisão manual de publicação.

## Parcelamento

Quando a taxa é repassada integralmente, o catálogo calcula o total necessário para preservar o valor líquido da venda:

```text
valor cobrado = (preço-base + taxa fixa) ÷ (1 - taxa percentual / 100)
parcela = valor cobrado ÷ quantidade de parcelas
```

No carrinho, a taxa incide uma única vez sobre o total dos itens.

## Integração com o sistema de mídia

O contrato está em:

```text
docs/API-SISTEMA-MIDIA.md
```

O prompt pronto para executar no projeto de referência está em:

```text
docs/PROMPT-SISTEMA-MIDIA.md
```

A origem deve expor uma API privada:

```http
GET /api/catalog-export?mode=incremental&limit=100&cursor=<cursor>
Authorization: Bearer <MEDIA_API_TOKEN>
```

O catálogo identifica produtos, marcas e categorias por `external_id` imutável. Produtos excluídos ou inativos são arquivados sem destruir ajustes comerciais já feitos.

## Contingência de custo pelo Tiny

O sistema de mídia deve enviar `tiny_product_id` sempre que houver vínculo com o Tiny. Quando `cost` e `average_cost` estiverem ausentes, o catálogo consulta:

```http
GET /produtos/{tiny_product_id}
```

A conexão recomendada é OAuth2 pelo próprio painel. `TINY_ACCESS_TOKEN` permanece apenas como opção legada.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e configure:

```text
DATABASE_URL=
AUTH_SECRET=
ADMIN_PASSWORD_HASH=
CRON_SECRET=
MEDIA_API_URL=
MEDIA_API_TOKEN=
TINY_CLIENT_ID=
TINY_CLIENT_SECRET=
TINY_REDIRECT_URI=
TINY_TOKEN_ENCRYPTION_KEY=
NEXT_PUBLIC_SITE_URL=
```

Nunca envie arquivos `.env` ao GitHub.

## Banco

Importe uma vez:

```text
database/schema.sql
```

O arquivo cria produtos, marcas, categorias, preços, parcelamento, configurações, histórico de sincronização e conexão criptografada do Tiny.

## Desenvolvimento

Requisitos:

- Node.js 22 ou 24;
- MySQL/MariaDB para persistência real.

Comandos:

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

Para gerar o hash da senha administrativa:

```bash
npm run hash-password -- "SUA-SENHA-FORTE"
```

## Rotas principais

```text
/                         catálogo
/produto/[slug]           produto
/admin/login              acesso administrativo
/admin                    dashboard
/admin/produtos           preços, promoção e destaque
/admin/marcas             logos das marcas
/admin/parcelamento       máquinas, bandeiras e taxas
/admin/configuracoes      contatos e integrações
/api/health               diagnóstico
/api/installments         simulação pública
/api/sync/media           sincronização protegida
/api/tiny/connect         início do OAuth do Tiny
/api/tiny/callback        retorno do OAuth do Tiny
```

## Publicação

O roteiro completo está em:

```text
docs/DEPLOY-HOSTINGER.md
```

A sequência operacional é: criar o banco, importar o schema, cadastrar variáveis, publicar pelo GitHub, conectar o Tiny quando necessário e executar a primeira sincronização completa.
