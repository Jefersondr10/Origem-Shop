SET NAMES utf8mb4;
SET time_zone = '-03:00';

CREATE TABLE IF NOT EXISTS catalog_settings (
  id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  catalog_name VARCHAR(120) NOT NULL DEFAULT 'Origem',
  logo_url TEXT NULL,
  whatsapp VARCHAR(30) NOT NULL DEFAULT '',
  whatsapp_message_template TEXT NULL,
  instagram VARCHAR(160) NOT NULL DEFAULT '',
  address TEXT NULL,
  maps_url TEXT NULL,
  business_hours VARCHAR(255) NULL,
  footer_text TEXT NULL,
  max_installments TINYINT UNSIGNED NOT NULL DEFAULT 12,
  default_machine_id BIGINT UNSIGNED NULL,
  default_card_brand_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO catalog_settings (id, catalog_name) VALUES (1, 'Origem');

CREATE TABLE IF NOT EXISTS brands (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  external_id VARCHAR(191) NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  source_logo_url TEXT NULL,
  manual_logo_url TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  source_updated_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brands_external_id (external_id),
  UNIQUE KEY uq_brands_slug (slug),
  KEY idx_brands_active_sort (active, sort_order, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  external_id VARCHAR(191) NULL,
  parent_id BIGINT UNSIGNED NULL,
  parent_external_id VARCHAR(191) NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  image_url TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  source_updated_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_external_id (external_id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_parent (parent_id),
  KEY idx_categories_active_sort (active, sort_order, name),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  external_id VARCHAR(191) NOT NULL,
  tiny_product_id VARCHAR(80) NULL,
  sku VARCHAR(191) NULL,
  ean VARCHAR(30) NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  short_description TEXT NULL,
  description_html LONGTEXT NULL,
  brand_id BIGINT UNSIGNED NULL,
  category_id BIGINT UNSIGNED NULL,
  images_json JSON NULL,
  attributes_json JSON NULL,
  stock_quantity DECIMAL(14,3) NULL,
  stock_status VARCHAR(30) NOT NULL DEFAULT 'available',
  source_active BOOLEAN NOT NULL DEFAULT TRUE,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  cost DECIMAL(14,2) NULL,
  cost_source VARCHAR(20) NOT NULL DEFAULT 'unknown',
  sale_price DECIMAL(14,2) NULL,
  promotional_price DECIMAL(14,2) NULL,
  promotion_starts_at DATETIME NULL,
  promotion_ends_at DATETIME NULL,
  manual_price_locked BOOLEAN NOT NULL DEFAULT TRUE,
  source_updated_at DATETIME NULL,
  archived_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_external_id (external_id),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_sku (sku),
  KEY idx_products_ean (ean),
  KEY idx_products_tiny_id (tiny_product_id),
  KEY idx_products_public (published, source_active, archived_at, featured),
  KEY idx_products_brand (brand_id),
  KEY idx_products_category (category_id),
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands (id) ON DELETE SET NULL,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_price_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  previous_sale_price DECIMAL(14,2) NULL,
  new_sale_price DECIMAL(14,2) NULL,
  previous_promotional_price DECIMAL(14,2) NULL,
  new_promotional_price DECIMAL(14,2) NULL,
  changed_by VARCHAR(120) NOT NULL DEFAULT 'admin',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_price_history_product (product_id, created_at),
  CONSTRAINT fk_price_history_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_machines (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  public_name VARCHAR(120) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  pass_fee_to_customer BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_machines_name (name),
  KEY idx_payment_machines_active (active, sort_order, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS card_brands (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  logo_url TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_card_brands_slug (slug),
  KEY idx_card_brands_active (active, sort_order, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS installment_rates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  machine_id BIGINT UNSIGNED NOT NULL,
  card_brand_id BIGINT UNSIGNED NOT NULL,
  installments TINYINT UNSIGNED NOT NULL,
  percent_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
  fixed_fee DECIMAL(14,2) NOT NULL DEFAULT 0,
  minimum_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_installment_rate (machine_id, card_brand_id, installments),
  KEY idx_installment_rates_active (active, installments),
  CONSTRAINT fk_rates_machine FOREIGN KEY (machine_id) REFERENCES payment_machines (id) ON DELETE CASCADE,
  CONSTRAINT fk_rates_card_brand FOREIGN KEY (card_brand_id) REFERENCES card_brands (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sync_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_type VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL,
  mode VARCHAR(30) NOT NULL DEFAULT 'incremental',
  cursor_value TEXT NULL,
  stats_json JSON NULL,
  error_message LONGTEXT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_sync_runs_source_started (source_type, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tiny_connections (
  id VARCHAR(30) NOT NULL DEFAULT 'primary',
  access_token_encrypted LONGTEXT NOT NULL,
  refresh_token_encrypted LONGTEXT NOT NULL,
  expires_at_ms BIGINT UNSIGNED NOT NULL,
  refresh_expires_at_ms BIGINT UNSIGNED NOT NULL,
  connected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
