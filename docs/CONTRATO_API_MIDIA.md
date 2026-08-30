# Contrato de integração — Sistema de mídia → Origem

## Endpoint

`GET /api/catalog/v1/export`

Autenticação obrigatória:

```http
Authorization: Bearer <token-servidor-a-servidor>
Accept: application/json
```

Parâmetros:

- `limit`: 1 a 500;
- `cursor`: cursor opaco retornado pela página anterior;
- `updated_since`: ISO 8601, usado em sincronizações incrementais.

## Resposta

```json
{
  "data": {
    "products": [
      {
        "id": "produto-id-estavel",
        "tiny_product_id": "123456789",
        "sku": "SKU-EXATO",
        "ean": "7890000000000",
        "name": "Nome do produto",
        "slug": "nome-do-produto",
        "description": "Descrição completa",
        "specifications": {"Conexão": "USB-C"},
        "brand": {
          "id": "marca-id-estavel",
          "name": "Marca",
          "slug": "marca",
          "logo_url": "https://cdn.exemplo.com/marcas/marca.svg"
        },
        "category": {
          "id": "categoria-id-estavel",
          "parent_id": null,
          "name": "Categoria",
          "slug": "categoria",
          "full_path": "Departamento > Categoria",
          "image_url": null
        },
        "images": [
          {"id": "img-1", "url": "https://cdn.exemplo.com/produto-1.webp", "alt": "Produto", "sort_order": 0}
        ],
        "cost": {
          "registered": 100.00,
          "average": 105.50,
          "currency": "BRL",
          "updated_at": "2026-08-30T00:00:00.000Z"
        },
        "stock": {"quantity": 10, "status": "in_stock"},
        "active": true,
        "updated_at": "2026-08-30T00:00:00.000Z"
      }
    ],
    "next_cursor": "cursor-opaco-ou-null",
    "has_more": false,
    "generated_at": "2026-08-30T00:00:00.000Z"
  }
}
```

## Regras obrigatórias

1. `id`, `brand.id` e `category.id` são estáveis e nunca reaproveitados.
2. `tiny_product_id` deve ser enviado sempre que houver vínculo com o Tiny; é a chave segura para o fallback de custo.
3. Imagens e logos devem usar URLs HTTPS diretas e estáveis, sem expiração curta.
4. O endpoint não envia preço de venda do catálogo. A Origem é a única fonte desse campo.
5. Produto removido deve continuar aparecendo por pelo menos uma sincronização completa com `active: false`.
6. O cursor deve ser opaco e determinístico.
7. O custo é informação privada e o endpoint não pode ser público sem token.
8. A API deve aplicar rate limit e registrar acessos.
