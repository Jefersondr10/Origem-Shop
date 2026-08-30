# Origem

Catálogo público e painel gerencial da **Origem**, preparado para hospedagem na Hostinger e integração com o projeto **Criar sistema de mídia para produtos**.

## Objetivo

Centralizar no catálogo:

- produtos, categorias, marcas, fotos, descrições e especificações vindos do sistema de mídia;
- custo vindo do sistema de mídia ou, como contingência, diretamente do Olist Tiny;
- preço de venda, promoções, destaques e visibilidade controlados exclusivamente pelo painel da Origem;
- simulação de parcelamento por máquina, bandeira e número de parcelas;
- carrinho com parcelamento sobre o valor total e finalização pelo WhatsApp.

## Fontes de verdade

| Informação | Fonte principal | Regra |
|---|---|---|
| Nome, SKU, EAN, descrição, fotos, marca, categoria e atributos | Sistema de mídia | Sincronização automática |
| Logo da marca | Sistema de mídia | Importar quando o recurso estiver disponível |
| Custo cadastrado e custo médio | Sistema de mídia ou Tiny | Nunca expor publicamente |
| Preço de venda | Painel Origem | Nunca sobrescrever em sincronizações |
| Promoção e destaque | Painel Origem | Independentes da fonte importada |
| Taxas de cartão | Painel Origem | Por máquina, bandeira e quantidade de parcelas |
| WhatsApp, Instagram e endereço | Painel Origem | Configuração global do catálogo |

## Catálogo público

- visual escuro, moderno e mobile-first;
- página inicial com busca, categorias, marcas, destaques e promoções;
- página de marca com logo e produtos;
- página de categoria e subcategoria;
- página individual do produto com galeria, descrição e especificações;
- card compacto com três ações:
  1. calculadora de parcelamento;
  2. adicionar ao carrinho;
  3. chamar no WhatsApp;
- carrinho persistente no navegador;
- alteração de quantidade e remoção de itens;
- cálculo do total à vista e parcelado;
- finalização pelo WhatsApp com produtos, SKUs, quantidades, valores e condição selecionada;
- produtos inativos na origem são ocultados, mas não apagados do histórico.

## Painel gerencial

### Dashboard

- quantidade de produtos publicados e ocultos;
- produtos sem preço, sem custo, sem foto, sem marca ou sem categoria;
- promoções e destaques ativos;
- data e resultado da última sincronização;
- falhas de vínculo com o Tiny.

### Produtos e preços

- busca por nome, SKU e EAN;
- filtros por marca, categoria, situação, promoção e destaque;
- custo importado somente para o administrador;
- preço de venda manual;
- preço promocional com início e fim;
- cálculo de margem e lucro estimado;
- alteração em massa por marca, categoria, pesquisa ou seleção;
- acréscimo percentual, acréscimo fixo e formação por margem;
- arredondamento opcional para finais como `,90` ou `,99`;
- trava de preço manual para impedir sobrescrita;
- ativar, ocultar, destacar e colocar em promoção.

### Parcelamento

- cadastro de máquinas/adquirentes;
- cadastro de bandeiras e respectivos logotipos;
- tabela de taxas por máquina, bandeira e número de parcelas;
- taxa percentual e taxa fixa opcionais;
- valor mínimo por quantidade de parcelas;
- escolha entre absorver a taxa ou repassar ao cliente;
- máquina padrão ou seleção automática da menor taxa;
- possibilidade de ocultar o nome da máquina no catálogo público.

Quando houver repasse integral da taxa, o total cobrado será calculado para que o valor líquido recebido corresponda ao preço-base:

```text
valor parcelado = (preço-base + taxa fixa) ÷ (1 - taxa percentual / 100)
parcela = valor parcelado ÷ número de parcelas
```

No carrinho, a taxa será calculada sobre o total do carrinho, e não separadamente em cada item.

### Configurações

- nome e logo da Origem;
- número do WhatsApp e mensagem padrão;
- Instagram;
- endereço e link do mapa;
- horários de atendimento;
- texto do rodapé;
- máquina e bandeira padrão da simulação;
- quantidade máxima de parcelas;
- integração com o sistema de mídia;
- integração de contingência com o Tiny;
- botão de sincronização manual e histórico de execuções.

## Regras de sincronização

1. A importação identifica o produto pelo `external_id` da fonte.
2. O vínculo comercial usa preferencialmente `tiny_product_id`; na ausência dele, usa SKU exato e depois EAN exato.
3. Nome parecido nunca será usado automaticamente para vincular custo.
4. Campos importados podem ser atualizados pela origem.
5. Campos comerciais da Origem nunca são sobrescritos.
6. Produtos removidos ou inativados ficam arquivados, preservando preço e histórico.
7. Uma sincronização completa cria e atualiza registros; a incremental usa `updated_since` e cursor.
8. Cada execução grava quantidade processada, criados, atualizados, arquivados e erros.

## Tecnologia

- Next.js com TypeScript;
- aplicação Node.js para publicação na Hostinger;
- banco MySQL/MariaDB da Hostinger;
- autenticação administrativa por sessão segura;
- integração servidor a servidor com token Bearer;
- segredos somente em variáveis de ambiente;
- deploy pelo GitHub conectado ao hPanel.

## Estrutura planejada

```text
app/                  páginas públicas, painel e rotas de API
components/           cards, carrinho, simulador e componentes administrativos
database/             estrutura SQL
lib/                   banco, autenticação, preços, parcelamento e sincronização
docs/                  contrato e prompt para o sistema de mídia
```

## Ordem de implementação

1. Estrutura, banco e autenticação administrativa.
2. Contrato e importação do sistema de mídia.
3. Catálogo público, produto, filtros e páginas de marca/categoria.
4. Preço, promoção e destaque no painel.
5. Carrinho, WhatsApp e parcelamento.
6. Contingência de custo pelo Tiny.
7. Deploy e rotina automática de sincronização na Hostinger.
