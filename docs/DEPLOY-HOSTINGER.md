# Publicação da Origem na Hostinger

## 1. Banco MySQL/MariaDB

No hPanel:

1. abra **Bancos de dados → Bancos de dados MySQL**;
2. crie o banco, usuário e senha;
3. abra o phpMyAdmin;
4. selecione o banco;
5. importe `database/schema.sql`;
6. confirme a criação das tabelas `products`, `brands`, `categories`, `catalog_settings`, `payment_machines`, `card_brands`, `installment_rates`, `sync_runs` e `tiny_connections`.

Monte a conexão com o host informado pela própria Hostinger:

```text
mysql://USUARIO:SENHA@HOST-DO-BANCO:3306/BANCO
```

Usuário, senha e nome do banco precisam ser codificados para URL quando contiverem caracteres especiais.

## 2. Senha administrativa

Na máquina local, execute:

```bash
npm install
npm run hash-password -- "SUA-SENHA-FORTE"
```

Copie somente o hash gerado para `ADMIN_PASSWORD_HASH`.

## 3. Aplicação Node.js

No hPanel:

1. abra **Sites → Adicionar site → Deploy Web App**;
2. escolha a integração com GitHub;
3. selecione `Jefersondr10/Origem-Shop` e a branch `main`;
4. selecione Next.js, caso a detecção não seja automática;
5. configure Node.js 22 ou 24;
6. use `npm install` como instalação;
7. use `npm run build` como build;
8. use `npm run start` como inicialização;
9. não use exportação estática: o catálogo possui autenticação, banco e rotas de API.

O `next.config.ts` também gera saída `standalone`, útil caso a publicação da Hostinger utilize o servidor gerado pelo Next.js.

## 4. Variáveis de ambiente

Cadastre no painel:

```text
DATABASE_URL=mysql://USUARIO:SENHA@HOST-DO-BANCO:3306/BANCO
AUTH_SECRET=<SEGREDO-ALEATORIO-COM-PELO-MENOS-32-CARACTERES>
ADMIN_PASSWORD_HASH=<HASH-BCRYPT>
CRON_SECRET=<OUTRO-SEGREDO-ALEATORIO>

MEDIA_API_URL=https://URL-DO-SISTEMA-DE-MIDIA
MEDIA_API_TOKEN=<MESMO-TOKEN-DA-API-DE-EXPORTACAO>

TINY_API_BASE_URL=https://api.tiny.com.br/public-api/v3
TINY_CLIENT_ID=<CLIENT-ID-DO-APLICATIVO-TINY>
TINY_CLIENT_SECRET=<CLIENT-SECRET-DO-APLICATIVO-TINY>
TINY_REDIRECT_URI=https://SEU-DOMINIO/api/tiny/callback
TINY_TOKEN_ENCRYPTION_KEY=<SEGREDO-ALEATORIO-COM-PELO-MENOS-32-CARACTERES>

NEXT_PUBLIC_SITE_URL=https://SEU-DOMINIO
```

`TINY_ACCESS_TOKEN` existe apenas como contingência legada. O fluxo recomendado é OAuth pelo painel, pois o catálogo guarda os tokens criptografados e renova o acesso automaticamente enquanto o refresh token permanecer válido.

## 5. Aplicativo OAuth no Tiny

No aplicativo criado no Olist Tiny:

1. habilite leitura de produtos;
2. informe como URL de redirecionamento exatamente:

```text
https://SEU-DOMINIO/api/tiny/callback
```

3. copie o Client ID e o Client Secret para as variáveis da Hostinger;
4. depois da publicação, entre em **Painel → Configurações → Conectar Tiny**;
5. conclua a autorização na conta correta.

O Tiny é contingência: o catálogo só consulta produtos cujo custo não veio do sistema de mídia e que possuem `tiny_product_id`.

## 6. Primeiro teste

Depois da publicação:

1. abra `/api/health` e confirme `status: ok`;
2. abra `/admin/login`;
3. entre com a senha usada para gerar o hash;
4. acesse **Configurações** e informe WhatsApp, Instagram, endereço e quantidade máxima de parcelas;
5. conecte o Tiny, caso ele seja necessário para completar custos;
6. acesse **Parcelamento** e cadastre máquinas, bandeiras e taxas;
7. execute uma sincronização completa no Dashboard;
8. confira produtos sem custo e sem preço no painel;
9. publique e precifique os produtos revisados.

## 7. Sincronização automática

A rota protegida é:

```http
POST /api/sync/media
X-Cron-Secret: <CRON_SECRET>
Content-Type: application/json

{"full": false}
```

Uma cron job pode chamar essa rota a cada 15 ou 30 minutos. Exemplo de `sync-origem.sh`:

```bash
#!/bin/sh
curl --fail --silent --show-error \
  -X POST "https://SEU-DOMINIO/api/sync/media" \
  -H "X-Cron-Secret: SEU_CRON_SECRET" \
  -H "Content-Type: application/json" \
  --data '{"full":false}'
```

Proteja esse arquivo e nunca coloque o segredo real no repositório. O agendamento da Hostinger usa UTC; ajuste o horário no hPanel.

## 8. Diagnóstico

- `401` na sincronização: token da origem ou segredo do cron incorreto;
- `500` com `DATABASE_URL`: confira host, usuário, senha, banco e codificação dos caracteres;
- catálogo em modo demonstração: `DATABASE_URL` não chegou ao processo;
- produto sem custo: a origem não enviou custo, o produto não tem `tiny_product_id` ou o Tiny precisa ser reconectado;
- produto sem preço: esperado até o preço ser cadastrado no painel;
- logo antiga: remova o override manual em **Marcas** para voltar a usar a logo importada;
- OAuth volta com erro: confira se a URL cadastrada no Tiny é idêntica a `TINY_REDIRECT_URI`.
