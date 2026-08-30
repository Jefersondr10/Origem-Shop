# Publicação na Hostinger

## 1. Banco

1. Crie um banco MySQL/MariaDB no hPanel.
2. Abra o phpMyAdmin.
3. Importe `database/schema.sql`.
4. Monte a variável `DATABASE_URL` no formato indicado em `.env.example`.

## 2. Aplicação Node.js

Conecte o repositório `Jefersondr10/Origem-Shop` à aplicação Node.js e use:

```text
Build: npm install && npm run build
Start: npm run start
```

Cadastre no painel todas as variáveis de `.env.example`. Não coloque senhas ou tokens em arquivos versionados.

## 3. Primeiro acesso

1. Abra `/admin/login`.
2. Entre com a senha definida em `ADMIN_PASSWORD`.
3. Configure logo, WhatsApp, Instagram, endereço e horários.
4. Cadastre as máquinas, bandeiras e taxas de parcelamento.
5. Configure `MEDIA_SYSTEM_API_URL` e `MEDIA_SYSTEM_API_TOKEN`.
6. Execute uma sincronização completa.
7. Revise os produtos sem custo e sem preço.
8. Defina preço, promoção, destaque e publicação.

## 4. Tiny como contingência

Configure `TINY_CLIENT_ID`, `TINY_CLIENT_SECRET` e `APP_ENCRYPTION_KEY`. Cadastre no aplicativo do Tiny o callback:

```text
https://SEU-DOMINIO/api/tiny/callback
```

Depois use **Conectar Tiny** no painel. O Tiny só é consultado quando o sistema de mídia não entregar custo e houver `tiny_product_id`.

## 5. Validação antes de abrir ao público

- teste o WhatsApp com um produto e com o carrinho;
- confira o parcelamento do total;
- confirme que custo não aparece na área pública;
- teste o catálogo no celular;
- verifique produtos desativados e sem preço;
- faça uma sincronização incremental e confirme que preços manuais foram preservados.
