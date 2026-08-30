# Contrato de integração — Sistema de mídia → Origem

O catálogo **Origem** consome uma API privada do projeto **Criar sistema de mídia para produtos**. A integração é de leitura: o catálogo importa conteúdo e custo, mas mantém preço de venda, promoção, destaque e publicação em seu próprio banco.

## Endpoint obrigatório

```http
GET /api/catalog-export?mode=incremental&limit=100&cursor=<cursor-opcional>
Authorization: Bearer <MEDIA_API_TOKEN>
Accept: application/json
```

Também deve aceitar:

```http
GET /api/catalog-export?mode=full&limit=100
```

### Segurança

- responder somente com HTTPS em produção;
- exigir `Authorization: Bearer` e comparar o token em tempo constante;
- não devolver credenciais do Tiny, tokens internos, margens ou qualquer segredo;
- limitar `limit` a no máximo 200;
- registrar data, status e quantidade de itens exportados, sem registrar o token;
- retornar `401` para token ausente ou inválido;
- retornar `429` quando o limite de requisições for excedido.

## Resposta

Pode retornar o objeto diretamente ou dentro de `{ "data": ... }`.

```json
{
  "brands": [
    {
      "external_id": "brand_attack_shark",
      "name": "Attack Shark",
      "logo_url": "https://midia.exemplo.com/marcas/attack-shark.webp",
      "active": true,
      "sort_order": 10,
      "updated_at": "2026-08-30T02:00:00-03:00"
    }
  ],
  "categories": [
    {
      "external_id": "cat_mouses",
      "parent_external_id": "cat_perifericos",
      "name": "Mouses",
      "image_url": "https://midia.exemplo.com/categorias/mouses.webp",
      "active": true,
      "sort_order": 20,
      "updated_at": "2026-08-30T02:00:00-03:00"
    }
  ],
  "products": [
    {
      "external_id": "product_123",
      "tiny_product_id": "987654321",
      "sku": "ATTACK-SHARK-X11-BLACK",
      "ean": "6970000000000",
      "name": "Mouse Gamer Attack Shark X11 Preto",
      "slug": "mouse-gamer-attack-shark-x11-preto",
      "short_description": "Mouse gamer tri-mode com base RGB.",
      "description_html": "<p>Descrição completa e revisada.</p>",
      "brand_external_id": "brand_attack_shark",
      "category_external_id": "cat_mouses",
      "images": [
        {
          "url": "https://midia.exemplo.com/produtos/x11/01.webp",
          "alt": "Mouse Attack Shark X11 Preto",
          "position": 1
        }
      ],
      "attributes": {
        "Conexão": "2.4 GHz, Bluetooth e USB-C",
        "Sensor": "PAW3311",
        "Cor": "Preto"
      },
      "stock_quantity": 25,
      "stock_status": "available",
      "active": true,
      "cost": 155.9,
      "average_cost": 153.4,
      "updated_at": "2026-08-30T02:00:00-03:00"
    }
  ],
  "deleted_product_external_ids": ["product_antigo_44"],
  "next_cursor": "eyJ1cGRhdGVkX2F0IjoiMjAyNi0wOC0zMFQwNTowMDowMFoifQ",
  "has_more": false,
  "source_updated_at": "2026-08-30T02:00:00-03:00"
}
```

## Campos

### Marcas

| Campo | Obrigatório | Regra |
|---|---:|---|
| `external_id` | Sim | Identificador imutável da marca na origem. |
| `name` | Sim | Nome público. |
| `logo_url` | Não | URL HTTPS direta, estável e pública para leitura. |
| `active` | Não | Padrão `true`. |
| `sort_order` | Não | Inteiro; padrão `0`. |
| `updated_at` | Não | ISO 8601 com fuso. |

### Categorias

| Campo | Obrigatório | Regra |
|---|---:|---|
| `external_id` | Sim | Identificador imutável. |
| `parent_external_id` | Não | Permite subcategorias. |
| `name` | Sim | Nome público. |
| `image_url` | Não | URL direta da imagem. |
| `active` | Não | Padrão `true`. |
| `sort_order` | Não | Inteiro; padrão `0`. |
| `updated_at` | Não | ISO 8601 com fuso. |

### Produtos

| Campo | Obrigatório | Regra |
|---|---:|---|
| `external_id` | Sim | Identificador imutável; chave principal da sincronização. |
| `tiny_product_id` | Recomendado | Melhor vínculo para buscar custo de contingência no Tiny. |
| `sku` | Recomendado | Código exato. Não reutilizar entre produtos. |
| `ean` | Não | Somente dígitos quando houver. |
| `name` | Sim | Nome comercial. |
| `slug` | Não | O catálogo gera um slug seguro quando ausente. |
| `short_description` | Não | Resumo sem HTML. |
| `description_html` | Não | HTML controlado; o catálogo ainda sanitiza antes de renderizar. |
| `brand_external_id` | Não | Deve existir na lista de marcas ou já ter sido exportado. |
| `category_external_id` | Não | Deve existir na lista de categorias ou já ter sido exportado. |
| `images` | Não | URLs diretas ou objetos com `url`, `alt` e `position`. |
| `attributes` | Não | Objeto simples de especificações. |
| `stock_quantity` | Não | Usado internamente; não será mostrado como número exato ao público. |
| `stock_status` | Não | Usar `available`, `low_stock`, `out_of_stock` ou `unavailable`. |
| `active` | Não | `false` arquiva o produto no catálogo. |
| `cost` | Não | Custo cadastrado. Tem prioridade sobre `average_cost`. |
| `average_cost` | Não | Custo médio, usado quando `cost` estiver ausente. |
| `updated_at` | Não | ISO 8601 com fuso. |

## Regras de cursor

- o cursor deve ser opaco para o consumidor;
- a ordenação precisa ser determinística, preferencialmente por `updated_at` + `external_id`;
- a próxima página não pode repetir nem pular registros;
- `has_more=true` exige `next_cursor` preenchido;
- o modo incremental deve incluir alterações desde o cursor, inclusive inativações e exclusões;
- exclusões físicas devem aparecer em `deleted_product_external_ids`;
- uma nova sincronização com o mesmo cursor deve ser idempotente.

## O que o sistema de mídia não deve controlar

Estes campos pertencem ao painel da Origem e nunca devem ser enviados como fonte de verdade:

- preço de venda;
- preço promocional e período da promoção;
- destaque;
- publicação manual;
- taxas e bandeiras de cartão;
- WhatsApp, Instagram, endereço e configurações visuais do catálogo.

## Testes mínimos na origem

1. token válido retorna `200`;
2. token inválido retorna `401`;
3. modo completo retorna marcas, categorias e produtos;
4. modo incremental retorna apenas registros alterados;
5. paginação não duplica nem perde produtos;
6. produto inativado chega com `active=false`;
7. produto excluído chega em `deleted_product_external_ids`;
8. logomarca chega em URL direta;
9. `tiny_product_id`, SKU e EAN permanecem estáveis;
10. custo não é incluído em nenhuma API pública destinada a visitantes.
