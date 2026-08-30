# Prompt para executar no projeto “Criar sistema de mídia para produtos”

Copie e envie o texto abaixo no projeto de referência:

---

Quero preparar este sistema para ser a fonte oficial de conteúdo do meu novo catálogo **Origem**, hospedado na Hostinger.

Implemente, sem remover nem quebrar funções existentes, os seguintes recursos:

## 1. Logos das marcas

Adicione em cada marca:

- campo para URL da logo;
- opção de upload da logo;
- pré-visualização;
- substituir e remover;
- validação de formato e tamanho;
- armazenamento que gere URL HTTPS direta e estável;
- logo com fundo transparente quando disponível.

A marca deve continuar tendo um identificador interno imutável. Alterar o nome da marca não pode trocar esse identificador.

## 2. Identificadores do Tiny e custos

Em cada produto, armazene e disponibilize para integração:

- `tiny_product_id`;
- SKU;
- EAN;
- custo cadastrado no Tiny;
- custo médio, quando disponível;
- data da última atualização do custo.

Se o sistema já estiver integrado ao Tiny, aproveite a conexão existente. Nunca exponha token ou credenciais do Tiny no navegador ou em resposta pública.

## 3. API privada de exportação para o catálogo

Crie o endpoint:

```http
GET /api/catalog-export
```

Parâmetros:

- `mode=full|incremental`;
- `limit`, com máximo de 200;
- `cursor`, opaco e opcional.

Proteja a rota com:

```http
Authorization: Bearer <CATALOG_EXPORT_TOKEN>
```

O token deve ficar somente em variável de ambiente. Compare-o de forma segura e retorne `401` quando estiver ausente ou incorreto.

A API deve retornar:

```json
{
  "brands": [
    {
      "external_id": "id-imutavel",
      "name": "Nome da marca",
      "logo_url": "https://.../logo.webp",
      "active": true,
      "sort_order": 0,
      "updated_at": "2026-08-30T02:00:00-03:00"
    }
  ],
  "categories": [
    {
      "external_id": "id-imutavel",
      "parent_external_id": null,
      "name": "Nome da categoria",
      "image_url": null,
      "active": true,
      "sort_order": 0,
      "updated_at": "2026-08-30T02:00:00-03:00"
    }
  ],
  "products": [
    {
      "external_id": "id-imutavel",
      "tiny_product_id": "123456",
      "sku": "SKU-EXATO",
      "ean": "7890000000000",
      "name": "Nome do produto",
      "slug": "nome-do-produto",
      "short_description": "Resumo",
      "description_html": "<p>Descrição completa</p>",
      "brand_external_id": "id-da-marca",
      "category_external_id": "id-da-categoria",
      "images": [
        {"url": "https://.../foto.webp", "alt": "Descrição", "position": 1}
      ],
      "attributes": {"Cor": "Preto"},
      "stock_quantity": 10,
      "stock_status": "available",
      "active": true,
      "cost": 100.0,
      "average_cost": 98.5,
      "updated_at": "2026-08-30T02:00:00-03:00"
    }
  ],
  "deleted_product_external_ids": [],
  "next_cursor": null,
  "has_more": false,
  "source_updated_at": "2026-08-30T02:00:00-03:00"
}
```

Regras obrigatórias:

- `external_id` deve ser imutável para marcas, categorias e produtos;
- a ordenação deve ser determinística por `updated_at` e `external_id`;
- `has_more=true` exige `next_cursor`;
- o cursor deve permitir retomada sem duplicar nem pular registros;
- o modo incremental precisa exportar alterações, inativações e exclusões;
- exclusões físicas devem entrar em `deleted_product_external_ids`;
- aceitar reprocessamento do mesmo cursor sem efeitos colaterais;
- usar URLs de imagens diretas, HTTPS e estáveis;
- não enviar preço de venda, promoção, destaque, margem ou configurações do catálogo;
- não expor esse endpoint em menus públicos;
- adicionar rate limit e log técnico sem gravar o token;
- sanitizar e validar os dados antes da resposta.

## 4. Testes e documentação

Inclua testes para autenticação, paginação, modo completo, modo incremental, inativação e exclusão. Documente as novas variáveis de ambiente e gere uma lista objetiva dos arquivos alterados.

Ao terminar, execute lint, verificação de tipos e build. Corrija qualquer erro encontrado. Não use dados fictícios em produção e não altere o comportamento atual do sistema fora do necessário para essa integração.

---
