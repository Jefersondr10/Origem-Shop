# Prompt para aplicar no projeto “Criar sistema de mídia para produtos”

Copie e envie o texto abaixo naquele projeto:

---

Implemente uma integração segura para o novo catálogo **Origem**, sem alterar o funcionamento atual do sistema.

Crie um módulo de **exportação de catálogo servidor a servidor** com estas exigências:

1. Crie o endpoint `GET /api/catalog/v1/export` autenticado por `Authorization: Bearer <token>`. O token deve vir de variável de ambiente e nunca aparecer no frontend, logs ou resposta.
2. O endpoint deve aceitar `limit` (máximo 500), `cursor` opaco e `updated_since` em ISO 8601. Não use paginação apenas por número de página: preciso de cursor estável para sincronização.
3. Para cada produto retorne:
   - `id` externo estável;
   - `tiny_product_id`;
   - `sku` exato;
   - `ean`;
   - `name`, `slug`, `description` e `specifications`;
   - `active` e `updated_at`;
   - `stock.quantity` e `stock.status`, sendo `in_stock`, `low_stock`, `out_of_stock` ou `unknown`;
   - `cost.registered`, `cost.average`, `cost.currency` e `cost.updated_at` quando esses dados existirem;
   - lista ordenada de imagens com `id`, URL HTTPS direta, texto alternativo e posição.
4. Para a marca retorne `id`, `name`, `slug` e `logo_url`.
5. Implemente no painel do sistema de mídia o cadastro da **logo da marca**:
   - upload ou URL;
   - pré-visualização;
   - validação de PNG, WebP ou SVG seguro;
   - preferência por fundo transparente;
   - armazenamento com URL permanente;
   - campo opcional, sem bloquear marcas antigas.
6. Para a categoria retorne `id`, `parent_id`, `name`, `slug`, `full_path` e `image_url` opcional.
7. Use exatamente o envelope e os nomes de campo documentados em `docs/CONTRATO_API_MIDIA.md` do repositório `Origem-Shop`.
8. Não envie preço de venda, promoção ou destaque: esses campos pertencem exclusivamente ao painel da Origem.
9. Produtos desativados ou removidos devem ser exportados com `active: false` para que o catálogo os arquive sem apagar histórico.
10. Garanta que URLs de imagens e logos não expirem em poucas horas. Não envie links temporários de storage.
11. Adicione rate limit, auditoria mínima, testes de contrato e uma tela de diagnóstico que mostre a última chamada, total retornado e erros, sem revelar o token.
12. Gere também uma variável de ambiente `CATALOG_EXPORT_TOKEN` e documente como criar um valor forte.

Antes de concluir, rode typecheck/build/testes. Entregue a lista dos arquivos alterados, o exemplo de resposta real sem segredos e qualquer migração necessária.

---
