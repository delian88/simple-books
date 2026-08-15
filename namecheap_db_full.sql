/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: accounts
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sub_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opening_balance` decimal(14, 2) NOT NULL DEFAULT '0.00',
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `accounts_company_id_idx` (`company_id`),
  KEY `accounts_parent_id_fkey` (`parent_id`),
  CONSTRAINT `accounts_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `accounts_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `accounts` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: activity_logs
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_logs_user_id_fkey` (`user_id`),
  KEY `activity_logs_company_id_idx` (`company_id`),
  CONSTRAINT `activity_logs_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: admin_profiles
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `admin_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Editor',
  `avatar_url` text COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_profiles_user_id_key` (`user_id`),
  CONSTRAINT `admin_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: admin_users
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Editor',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_users_email_key` (`email`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: balance_items
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `balance_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `side` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Other',
  `amount` decimal(14, 2) NOT NULL,
  `as_of` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `balance_items_user_id_idx` (`user_id`),
  KEY `balance_items_company_id_idx` (`company_id`),
  CONSTRAINT `balance_items_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `balance_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: branches
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `branches` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `branches_company_id_idx` (`company_id`),
  CONSTRAINT `branches_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: companies
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `companies` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NGN',
  `default_language` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `fiscal_year_start_month` int(11) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: company_users
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `company_users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VIEWER',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_users_user_id_company_id_key` (`user_id`, `company_id`),
  KEY `company_users_company_id_idx` (`company_id`),
  CONSTRAINT `company_users_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `company_users_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: credit_note_allocations
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `credit_note_allocations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credit_note_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14, 2) NOT NULL DEFAULT '0.00',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `credit_note_allocations_credit_note_id_idx` (`credit_note_id`),
  KEY `credit_note_allocations_invoice_id_idx` (`invoice_id`),
  CONSTRAINT `credit_note_allocations_credit_note_id_fkey` FOREIGN KEY (`credit_note_id`) REFERENCES `credit_notes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `credit_note_allocations_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `sales_invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: credit_notes
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `credit_notes` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credit_note_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime(3) NOT NULL,
  `amount` decimal(14, 2) NOT NULL DEFAULT '0.00',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `credit_notes_company_id_idx` (`company_id`),
  KEY `credit_notes_customer_id_idx` (`customer_id`),
  CONSTRAINT `credit_notes_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `credit_notes_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: customer_payments
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `customer_payments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime(3) NOT NULL,
  `amount` decimal(14, 2) NOT NULL DEFAULT '0.00',
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BANK_TRANSFER',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPLETED',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_payments_company_id_idx` (`company_id`),
  KEY `customer_payments_customer_id_idx` (`customer_id`),
  CONSTRAINT `customer_payments_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `customer_payments_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: customers
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `customers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NGN',
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customers_company_id_idx` (`company_id`),
  CONSTRAINT `customers_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: documents
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `documents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longblob NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `documents_company_id_idx` (`company_id`),
  CONSTRAINT `documents_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: expenses
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `amount` decimal(14, 2) NOT NULL,
  `date` datetime(3) NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `flag_reason` text COLLATE utf8mb4_unicode_ci,
  `is_flagged` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `expenses_company_id_idx` (`company_id`),
  KEY `expenses_document_id_idx` (`document_id`),
  CONSTRAINT `expenses_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `expenses_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: journal_entries
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `journal_entries` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime(3) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `reversal_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'POSTED',
  `template_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `journal_entries_company_id_idx` (`company_id`),
  KEY `journal_entries_template_id_fkey` (`template_id`),
  KEY `journal_entries_reversal_id_fkey` (`reversal_id`),
  KEY `journal_entries_company_id_date_idx` (`company_id`, `date`),
  CONSTRAINT `journal_entries_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `journal_entries_reversal_id_fkey` FOREIGN KEY (`reversal_id`) REFERENCES `journal_entries` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE,
  CONSTRAINT `journal_entries_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `journal_templates` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: journal_lines
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `journal_lines` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `journal_entry_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `debit` decimal(14, 2) NOT NULL DEFAULT '0.00',
  `credit` decimal(14, 2) NOT NULL DEFAULT '0.00',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `journal_lines_journal_entry_id_idx` (`journal_entry_id`),
  KEY `journal_lines_account_id_idx` (`account_id`),
  CONSTRAINT `journal_lines_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `journal_lines_journal_entry_id_fkey` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: journal_templates
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `journal_templates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `journal_templates_company_id_idx` (`company_id`),
  CONSTRAINT `journal_templates_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: landing_page_config
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `landing_page_config` (
  `id` int(11) NOT NULL DEFAULT '1',
  `config` json NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: pages
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `pages` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `published` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pages_slug_key` (`slug`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: payment_allocations
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `payment_allocations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14, 2) NOT NULL DEFAULT '0.00',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `payment_allocations_payment_id_idx` (`payment_id`),
  KEY `payment_allocations_invoice_id_idx` (`invoice_id`),
  CONSTRAINT `payment_allocations_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `sales_invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payment_allocations_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `customer_payments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: payment_gateways
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `payment_gateways` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `public_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secret_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_gateways_provider_key` (`provider`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: profiles
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'My Business',
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NGN',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `profiles_id_fkey` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: recurring_schedules
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `recurring_schedules` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frequency` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` datetime(3) NOT NULL,
  `end_date` datetime(3) DEFAULT NULL,
  `last_run` datetime(3) DEFAULT NULL,
  `next_run` datetime(3) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `recurring_schedules_company_id_idx` (`company_id`),
  KEY `recurring_schedules_next_run_idx` (`next_run`),
  KEY `recurring_schedules_template_id_fkey` (`template_id`),
  CONSTRAINT `recurring_schedules_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `recurring_schedules_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `journal_templates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: sales_invoice_lines
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `sales_invoice_lines` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(14, 2) NOT NULL DEFAULT '1.00',
  `unit_price` decimal(14, 2) NOT NULL DEFAULT '0.00',
  `amount` decimal(14, 2) NOT NULL DEFAULT '0.00',
  `tax_rate` decimal(5, 2) NOT NULL DEFAULT '0.00',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `sales_invoice_lines_invoice_id_idx` (`invoice_id`),
  CONSTRAINT `sales_invoice_lines_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `sales_invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: sales_invoices
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `sales_invoices` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_date` datetime(3) NOT NULL,
  `due_date` datetime(3) NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `subtotal` decimal(14, 2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(14, 2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(14, 2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `terms` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sales_invoices_company_id_idx` (`company_id`),
  KEY `sales_invoices_customer_id_idx` (`customer_id`),
  CONSTRAINT `sales_invoices_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sales_invoices_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: system_settings
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_key_key` (`key`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: template_lines
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `template_lines` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `debitRatio` decimal(14, 4) NOT NULL DEFAULT '0.0000',
  `creditRatio` decimal(14, 4) NOT NULL DEFAULT '0.0000',
  `is_fixed_amount` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `template_lines_template_id_idx` (`template_id`),
  KEY `template_lines_account_id_idx` (`account_id`),
  CONSTRAINT `template_lines_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `template_lines_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `journal_templates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: transactions
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direction` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14, 2) NOT NULL,
  `occurred_on` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `counterparty` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `branch_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transactions_user_id_idx` (`user_id`),
  KEY `transactions_company_id_idx` (`company_id`),
  KEY `transactions_branch_id_fkey` (`branch_id`),
  KEY `transactions_category_id_fkey` (`category_id`),
  KEY `transactions_user_id_occurred_on_idx` (`user_id`, `occurred_on`),
  CONSTRAINT `transactions_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE,
  CONSTRAINT `transactions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `accounts` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE,
  CONSTRAINT `transactions_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: users
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Company',
  `subscription_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trial_ends_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: accounts
# ------------------------------------------------------------

INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '14bc81b9-d136-4e86-81ab-545b14f0faba',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Creditors',
    NULL,
    'LIABILITY',
    'Accounts Payable',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:43.679',
    '2026-08-15 15:08:43.679'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1f159a75-c458-4ffd-860d-44c59579c562',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Long Term Loan',
    NULL,
    'LIABILITY',
    'Long Term Liability',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:42.532',
    '2026-08-15 15:08:42.532'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '2a9c03e2-0c46-41bb-930b-47bf7d353673',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Medical Expenses',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:59.742',
    '2026-08-15 15:08:59.742'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '3137eacb-01a3-4ac6-b353-74ca14c41377',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Salaries & Wages',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:50.142',
    '2026-08-15 15:08:50.142'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '32f0d228-da58-4087-8bc5-f454c6caf363',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Rent/Insurance',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:09:00.847',
    '2026-08-15 15:09:00.847'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '44e7b659-352d-4ba3-a9da-12ea41787dd7',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Stock',
    NULL,
    'ASSET',
    'Current Asset',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:38.008',
    '2026-08-15 15:08:38.008'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '48144559-341c-4846-ba60-563d04f487b1',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Printing & Stationery',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:56.052',
    '2026-08-15 15:08:56.052'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '4a5ebaa4-d2c9-4457-939d-86769f3a8b20',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Electricity',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:58.516',
    '2026-08-15 15:08:58.516'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '4b188eb3-cd28-464f-9eeb-05e656014d60',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Telephone Expenses',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:57.319',
    '2026-08-15 15:08:57.319'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '52b25cc2-b941-4119-8c7f-f6f17ae84f31',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Expense',
    NULL,
    'EXPENSE',
    NULL,
    NULL,
    0.00,
    0,
    '2026-08-07 12:41:07.560',
    '2026-08-07 12:41:07.560'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '6b552a7d-915a-48f9-ad9a-b729b28752a9',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Legal/Audit Fees',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:09:04.875',
    '2026-08-15 15:09:04.875'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '8ee80b3f-29dc-4668-8386-d7a73f8a9751',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Cash Balance',
    NULL,
    'ASSET',
    'Cash',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:41.444',
    '2026-08-15 15:08:41.444'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '9118971a-e7a2-454d-842c-685bf52a4933',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Delivery Expenses',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:54.856',
    '2026-08-15 15:08:54.856'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '929fa17d-2318-4752-8e91-968c4ae7bb29',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Retained Profit',
    NULL,
    'EQUITY',
    'Retained Earnings',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:46.017',
    '2026-08-15 15:08:46.017'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '97c79df6-afb7-44ab-9416-8806ce89fd78',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Other Income',
    NULL,
    'REVENUE',
    'Other Income',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:47.286',
    '2026-08-15 15:08:47.286'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '9cfdf630-c9e3-4fc3-abc0-bd960fc35cfc',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Sales',
    NULL,
    'REVENUE',
    NULL,
    NULL,
    0.00,
    0,
    '2026-08-07 12:41:06.683',
    '2026-08-07 12:41:06.683'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'a270261d-3413-47b7-8fbc-e5ee7b543665',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Others (Other people I am owing)',
    NULL,
    'LIABILITY',
    'Short Term Liability',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:44.738',
    '2026-08-15 15:08:44.738'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'b6ebe229-9d38-488e-98c6-8ad256562975',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Bank Balance',
    NULL,
    'ASSET',
    'Bank',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:40.268',
    '2026-08-15 15:08:40.268'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'b766d2f1-7401-4bf7-a9a9-845c5d1876f6',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Computer & Internet Expenses',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:09:03.491',
    '2026-08-15 15:09:03.491'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'b807c2bc-1973-482e-aebd-546e1676df36',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Motor Running Expenses',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:53.658',
    '2026-08-15 15:08:53.658'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'b8fde5e3-bb49-4ddb-95f4-3db3db5fd25f',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Building',
    NULL,
    'ASSET',
    'Fixed Asset',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:33.081',
    '2026-08-15 15:08:33.081'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'bd715188-8e61-4ec5-a378-ff5eeb8fc79e',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Power Generating Set',
    NULL,
    'ASSET',
    'Fixed Asset',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:35.792',
    '2026-08-15 15:08:35.792'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'be812651-33b1-45bb-ba23-f4104d2ddacf',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Liability (Loan)',
    NULL,
    'LIABILITY',
    NULL,
    NULL,
    0.00,
    0,
    '2026-08-07 12:41:09.245',
    '2026-08-07 12:41:09.245'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'bf0c88de-14fb-4895-b304-5264ea599214',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Capital',
    NULL,
    'EQUITY',
    NULL,
    NULL,
    0.00,
    0,
    '2026-08-07 12:41:08.426',
    '2026-08-07 12:41:08.426'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'c33224d1-16d5-45d5-9410-06f8fa00b99a',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Cash',
    NULL,
    'ASSET',
    NULL,
    NULL,
    0.00,
    0,
    '2026-08-07 12:41:05.573',
    '2026-08-07 12:41:05.573'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'c6d3ee76-20c4-423a-8314-7eaffdb88865',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'General Office Expenses',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:09:05.995',
    '2026-08-15 15:09:05.995'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'd289a7a7-c22c-474c-a405-961357706e15',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Machines/Equipment',
    NULL,
    'ASSET',
    'Fixed Asset',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:36.972',
    '2026-08-15 15:08:36.972'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'dd4fc6bc-8f43-4b28-b494-7f8184a5e5c4',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Direct Cost of goods or services',
    NULL,
    'EXPENSE',
    'Cost of Goods Sold',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:48.956',
    '2026-08-15 15:08:48.956'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'e2b1af1e-1f5c-47f6-8a72-39daab089328',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Debtors (people owing me)',
    NULL,
    'ASSET',
    'Accounts Receivable',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:39.150',
    '2026-08-15 15:08:39.150'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'e90685c8-c541-41a7-86d8-c98f15d2f3e3',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Transport & Travelling',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:52.606',
    '2026-08-15 15:08:52.606'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'f26ae9d9-cb43-442e-a75c-9d5c4f24698c',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Repairs & Maintenance',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:09:01.916',
    '2026-08-15 15:09:01.916'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'f5bdb5ea-9dda-4107-9e63-4bb9e6dc01ca',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Selling & Distribution Expenses',
    NULL,
    'EXPENSE',
    'Operating Expense',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:51.349',
    '2026-08-15 15:08:51.349'
  );
INSERT INTO
  `accounts` (
    `id`,
    `company_id`,
    `name`,
    `code`,
    `type`,
    `sub_type`,
    `parent_id`,
    `opening_balance`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'f6161b1b-fe58-4f21-aeac-4d364f44c8e2',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Motor Vehicle',
    NULL,
    'ASSET',
    'Fixed Asset',
    NULL,
    0.00,
    0,
    '2026-08-15 15:08:34.700',
    '2026-08-15 15:08:34.700'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: activity_logs
# ------------------------------------------------------------

INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    '2454fa44-458a-4bad-80d1-4f2e02ca0e29',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-09 05:27:38.631',
    NULL
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    '2a72a158-ffc3-4a69-80b7-2c7f862fa2d9',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-10 16:50:00.123',
    NULL
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    '2d3b23f9-6b3f-4688-b3a6-a7245d21ed07',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-15 22:05:16.442',
    NULL
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    '394bf6e0-60b3-4ceb-ad8a-8929756164ab',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-11 22:46:07.597',
    NULL
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    '415bb34d-bd4f-4ee9-92a2-880760534d31',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-10 17:51:09.258',
    NULL
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    '50aa2f31-6b26-4abe-95ab-f4d44c9c15b1',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-14 08:10:20.546',
    NULL
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    '5a91c3dc-3fcf-4db9-860a-119850a5b2f3',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-14 00:53:34.970',
    NULL
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    '7d707506-e054-4124-a855-f686931efef7',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-11 07:45:08.250',
    NULL
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    '922c51b1-5bf5-40a5-95fb-a0ef92fe28b2',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-15 14:28:49.980',
    NULL
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    'b016f35d-838b-445b-a7ab-dbb9aaa6266d',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-09 05:49:45.675',
    NULL
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    'b022e2c9-cbbe-4afd-a1c3-a05a10b07d50',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-07 11:56:58.291',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc'
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    'c6edb0c7-34e4-466e-95c4-63f223dafaa6',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-09 06:03:32.849',
    NULL
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    'dc00d842-fcc7-4f9d-ac02-91d9b4665df9',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-07 12:07:58.492',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc'
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    'f40e1be1-cee0-464e-bf96-d77fe5e1e279',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-07 12:56:15.465',
    NULL
  );
INSERT INTO
  `activity_logs` (
    `id`,
    `user_id`,
    `action`,
    `description`,
    `created_at`,
    `company_id`
  )
VALUES
  (
    'fc21b9b5-4831-4b3e-888b-8351da2fb928',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'LOGIN',
    'User logged in to the platform.',
    '2026-08-12 21:52:06.784',
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: admin_profiles
# ------------------------------------------------------------

INSERT INTO
  `admin_profiles` (
    `id`,
    `user_id`,
    `full_name`,
    `email`,
    `phone`,
    `role`,
    `avatar_url`,
    `updated_at`
  )
VALUES
  (
    1,
    1,
    'Olympian House Admin',
    'contact@olympianhouseintl.com',
    NULL,
    'SuperAdmin',
    NULL,
    '2026-08-07 11:11:03.000'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: admin_users
# ------------------------------------------------------------

INSERT INTO
  `admin_users` (
    `id`,
    `email`,
    `password_hash`,
    `role`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    1,
    'contact@olympianhouseintl.com',
    '$2y$10$n8Y/1A5TmRU.W4TdmdL7Ae3rb/h7ARirkazdgKCLuDrnGcdy3Qx72',
    'SuperAdmin',
    '2026-08-07 11:11:03.000',
    '2026-08-07 11:11:03.000'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: balance_items
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: branches
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: companies
# ------------------------------------------------------------

INSERT INTO
  `companies` (
    `id`,
    `name`,
    `tax_id`,
    `default_currency`,
    `default_language`,
    `fiscal_year_start_month`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Nutech Business',
    NULL,
    'NGN',
    'en',
    1,
    '2026-08-07 11:53:17.596',
    '2026-08-07 12:15:51.865'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: company_users
# ------------------------------------------------------------

INSERT INTO
  `company_users` (
    `id`,
    `user_id`,
    `company_id`,
    `role`,
    `status`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '17c8c99e-4f82-4ce0-928d-9621eac11998',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'OWNER',
    'ACTIVE',
    '2026-08-07 12:15:53.163',
    '2026-08-07 12:15:53.163'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: credit_note_allocations
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: credit_notes
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: customer_payments
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: customers
# ------------------------------------------------------------

INSERT INTO
  `customers` (
    `id`,
    `company_id`,
    `name`,
    `email`,
    `phone`,
    `address`,
    `currency`,
    `is_archived`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '3302da80-28aa-45aa-b493-4da89fe72919',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Nutech',
    'nutech2005@gmail.com',
    '09055667788',
    'Lagos Nigeria',
    'NGN',
    0,
    '2026-08-07 14:17:21.269',
    '2026-08-07 14:17:21.269'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: documents
# ------------------------------------------------------------

INSERT INTO
  `documents` (
    `id`,
    `company_id`,
    `filename`,
    `mime_type`,
    `content`,
    `created_at`
  )
VALUES
  (
    '08ac55b9-5141-4af4-aac7-83c4ff03f6dd',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'images.png',
    'image/png',
    X'89504e470d0a1a0a0000000d49484452000001430000026b08030000004dfa01f300000069504c5445fffffffefefe000000fbfbfbf4f4f4f8f8f8eeeeeed2d2d2bbbbbbe4e4e4f1f1f1dadada1111115d5d5d7e7e7e6b6b6b494949a0a0a05858588b8b8b767676c6c6c6434343929292989898acacac8484842323236565650b0b0b3434342c2c2c1c1c1c3c3c3c505050bfc9ed000000200049444154789ced5d0b63a3aa120611148d1aa346312631f9ff3ff2ce0c604c9bddbb8fbadbede13b675b8b08e3c87b5e8c73c159c06fa1cb78e0e16fa2562cf0f037a164e8cb0101010101010101010101010101010101010101010101010101010101010101ff7570b6d6c3e1cbff9cfb749f83d33f9f48a91cf15c9c4b7019f9f2e4fa617bc317c196071ed570ff007745aeebb189cf595de9cf19fd6b3c17e9ffe08faad7f97e8277be12c9b910be4cbcb2ffd3a52dd8ff61538525cd26c09f0275f21cab5c8acf0c498f3fec2f4fb278d4640b603e87afdc96e7fea052857f77f89b094b16d5e64917784bfaef8ac4bb0ccbfb2c942f15b9a4c77b73f1d33c147cf53dec6b50618c48765f8e23c9feb66721e30b8796b2b8fd49255a5a88ad78fd449baf83725b86d9e239a688a5b508e1bea17db9a58d596a047193f99cf63f24764d916f0d9e4e5b8b4d12ecf1a119fde99ad3cfb1d0bf005b7e4a4bd753b2a46e22846436bb587aac587d38bef0673d0ed05710f29934c15c1b4096095f9414eecb3c8a129ee98f4eeb6eba86f5e87c0f36b1070f1dc1cb4daa5032fba29e48ff3a02dffd17da216ba328ba68b84ce1624ea1347d83ab16dfba818b0815173bbc304089aae06252f05c8fd913b8a7f05e8f441de0e28ed90d5c9c534852d7e81c95485709493bac267145b16c828b02b36351510ef46778d1403531debb6b57549442923cc34585341758730e853aaa18d37bcc1e735794c29af1628402e2d61625d880491d72152f0a641edebbe24b743baa068a4a7f9a879ca5fdd0d7195ce6fd300c39d0a16a484ab185c2bda18f2193c60bac2b36784f62ad985d43f6182e9a0ebf07de33313483a487b41c92322a0adb105633603558d49020536c765754af8087122f3abc97fa7b39e4ee812a2ef1825ed06009ca15055441355414362c2caa8921296e065bb32d2ac36ae0b126471ee23d83ed8f5e1ef99bdb7bf05cfef33c7cdbfdc5ba852f57ee9e4f7adc13ef06612ede298bf2f7a3cc92c9f723f6185897a4e562e9f14f84be4df133de6a6ef563155b260b1a209f097dd4cc1f35fe04dc84e44ae77e60166e04e77e50b683b05ce6d8c73cf618ebfd8ce4ca595e82733735f86c6cc925fcace147f965c6e7abc17f99e8f9321a0b479a5c0668f1c8b79aa31cfd627dbdccc09e2c3ff53d68fc39b8559aff46cc2d94dc88efabe00b4399af93fb85e3a362970753ddbce0dad3ba4931b79259ad079f5e9b3d3ee9521a4d35aba5ac27ead1e46846f70b4ab614e657983497b86fcdedec4f8b85f52b31bf00090808f86fc28ddf746d376dc2cd818f51c5cd0262b523a171433c4d14761af14334a5b1d570be1ef5dcee442c8397af629945fc40eb67065b9da3d757fb18bb1e53dd63925de618b66c46dd48bf4c30abf1d155b35a84fc0c0fe56a79cf1ffb6462839fe7fc3cb63cc4fd667621d9cfa5629dc6963d989b0cd932f1b87dace38c707b42eee75c57267bec6e17d63caa798cffc2cfe58fbd236d77fcebb035b785604b66578d6535a70a7f96859ea41573d8a3c5ac96556c4df17a327cfb499e733c4dda6f7785ec8907dfac6659d9bdaf86ad0b78b1d87b73f178f22531bf6a04c5196e19445a03706b95c36fd861e02e0293b0ce6470f734a6e0b6805176d85cf27ca0ecb0cf33f550a7b8e7c57b063775da15051b0b4c42ee24f5aaa8a1c32457146e482049d356082e525c0f755026ec3004a7ec5833a7a2b0cbb9a26053675c512c1d2c558ceee14b64981d765558143c87fb4a3550519c497f0fb2439aa60d9aabe66779885b57d9c0b6f6824f77b8c1c52d527c818b33f2b0868b13d69a9ce06ac0c5550517d70cb9139dcfb46385ecb09b859793a3cd0e4561762a1d8bbae0fe108bbac28e952598d463c7c3a24eb8a94be122a2fdf701f7d8928a8aa21bb235d9b98db138c2bd224666daa2608b8a493db6af162ee6cc1535c30765bac0a260f749545da8916035355275c7a2141605297387f72eae9a9fe5618c738344e00822622963893d1c2ea4a2910a9368b0a24cf814dea371142f621a3963788c92f056cc5d524c852a4a02d03d3ab18c5d8562294a5235b650b8c46a6c6eac1aaf70b3cdb225bb27c65e6147ccfc858c9f72e198ef5e1068c06a6266ab89a91a91e12be3b00609d9cf9fdb3ca627463b48bb25582690a761663582f85ccc1f73d959cd4fb5ab517139a395cc8fe0ee38d28fefae78bb0f71b3ff7a58a5a1eb4188df93ae8eb8fc46f769d7e4cf31b1c9adf637cbb6f669f4e3eedeafed52fc34bc2c22fcc4ead3057bdc5bd127dc32822f27db8f250373077beeae5852d7053dad307ccd7e06e68f95827027b6eeed059df02d0f2e0cf1db6e269eab79bc0ce7fecbbf791b57bd3feafe0bd8bad6b7e56f545fd82607040404040404040404040404040404047c20f82ba956c0cfe071021bf08be02fae022c64bc40ba24113fc1cb4b44a600317f9949d8142ce2519e785b83cffab5204ddb962da22c7b9393a64652b52b349a2450b2abdbfded766f4d82bafc2c7fca54e68c1e4b5144ea13c721452de674c9491555faabb56492e49e2da2f3b1461ea63e81126f396a27aaf21a9de779de9d77b701054e49b4ca159d3bab203e4089d7c79ddd94a08ab6adc1a5463faffdfbc9219bf3698e2ce6d32e32d870a2d3295a7045dd075544b3cb36ef4823be834ce747ae8e52e61a4abcccbec4f9743ee656373d82ecaed0e4cbb543e0e125d5886e8297bf6a6c50a7a8a6c18f802a0c2df0e7d2678ca9fe3a9f50b920814c6dbccef4e0e17ccba1bcdcdc77d7a892b1d690a199e7abf159bf169087a4c381d72db4c9d4f270a58201835f779de7a3cbd5dda2a88a8987e3aa20bee6e1d1ce1bfa06bd5fd9fbc36ef6f57c353c78c8b113cf27e379b812c9cb067a62ed15e46a985632c7c3f59a71cd436c6b905aed4e91a6a788873f6f4bf24f60c543d4517ad90e993aeca07bba150e27f59777ed30f090b43172e8b117371e0e2aa74132d731f44960cbc1997509abde813c3cb71966c0ffd14ce77d5fcea12f5fa82f7f791e9eda1a8d9a2a9c7aeb77f332bcb88661ad78b359061e9e764b26e0ddd39c92e4799e98fdee741e9c9ef257e7a15da39c4fbbddc8b9e5e1ec577ed0b9790eebc2e9cd8a2459653a9fb1eb7b1edee6d3e902b8ee60063f5057fe0ff0d02de6e6369168730a3cdceddbcaa285c1525fe75dc19e4d348187f3d167aa903b6b1eda15364ce0b957a1fbe23cbc0e5dda19e882936292f62938a7080718fc708db28fd9c3c897d9f561f9c8c49e797838dcef8743d979a5f3afcf439a977b98430732937c332f3316b79429b64b99a4ced5fb7999bf9b97d9d3ddafcf43d4103fce33ea71f377eb43cecdeeb46b25d93c32594651abdfac0f71a67ec743be3e2ffbfa3cc47e6a60b57260ec7d3be42c871976eeed78d8c06857bcdfa7bc581fae6d36fe033ca486743f53fb431e9edbda634860aa3630c7ce973aedea1b70734e8863bb835972a562351e220fdf9c77f3fe2bf370375fec3e85c11afb74caa941ae967e6853014c9c77f6e0669ecfc8f337ebc3a88dbf371e72e0e1fc757938a257087b29f094aa52d627c3030d7abf606975b17f5edac4ce204f001ebaf3c318587d7dcb43ce47e732e2eb818b244d535a07c394ace03a554c9b748d44921e7f96a4fd38f66942d333536f33310dbf60532df0cfb70e0f6036f7f57c3daca7ce6f1d8d5a034d86ce50e4622ff28d925ecbfdbe5d764040404040404040404040404040404040c08fc09f3ebd497873f9ce85d5fb72be7b50f5de39d5abfabe49de77abe12f0a5dc9b53fe4000daad5a88681a52ab848d04d9184df498e4774702f49d0ddaf82df097a0c923924e582bb7be8762746350e3c0d159889ee29f89d284a82346dab8124d2aec624856e54748e4541129290a0131a010560762c0aa9e20faa38c702e8d0952846f75659eeaa795005d9938e8e26f139d25a4642293b151593fb2d5b0de75414eaf664784fe1c966f6f34c646db4db1d913613cdbb13baa9d2f7dd2e6af17d475452251568c834a34aabaacef3b952f0e6cd79deed50774ba35a4d836f7238efce0785a2cf6837efc8b7f31e8b42bda4124b47addf042ea028c9540b451558fa78861290750aeb1b99e0195673d0281c44b14b8abeb92f3bc88e34dfa1e68bf5edbc9bad6fe70364bfc7023d4e4309e4060ca942afd2591b615128093cdba23883b739a3be8f807bbb1bead1a6540dff25dfce8225699776c83095c215392debf02c1efd1ee570d1c55cd0b17ca7e1a3cac49ed3c33d78ac430f54714a67f6e8c7cc1ef473ae3a920140a3ebe08a64cc5494ab264d357ac9b3d9814f782f4567671233a1f7658149097995866a52ec01c257c3f0b92e83ec8aa8a246875728eacaf125b06d4b12286051494745b96a147ed094a8823e44cfa12b354d5461f69f972fbc7790bc1cbeaf1ce4bd73d6b75cbcf077f7dee3fe8ba3fe25e9fd05e3cb80b5d42c5e0ccaefcb7ce51077e5147049782b65581cf9058fba01010101010101ff797017a3076dbc325c554b952985cb6441665ce409d4da73b9245cac323209c385166527afac684a966181740f93283b9984e22d4575d13d5f3ab9887545f97bb86acb7c3592a8c26de1625206f7b26c957d5d8da7ca518ccf655071862f412fc87dcdd25793f96a1e54fdbce51aec72904d75314d2d6edc92aa9a0e093af66ca7692ac8d8e9304d15ee87f20a52c83bf0504c4515d33dc88e9a7231642f7ad87c605145459b3ac87e4027c4022eaa8a948a0b5f1466c7a031bc87a489a2c7e005aa28a912ee0d68d4574fc5d4a2d3e51c6e1d7013c6e1b96ac42d8d2b8ab9a2f0fb035553811b3e2caac29ad55854c500df43d4504245716be06d0a8a4d334252831c4ba19a294137c6ed5414bfb2d7eb705f6eca716c88da711cdb047641b287ab1179d8b570414ead9b712cb10a9b5de2c36d39a2ea1b93780f98c224dc2b47dc304151654bdeb71bcc8edae81d5c8cb897b345a1eeba19b128b493827b257ec66c8002d007b63070d1e04e2cc77bf8a9785f96e5802e873bb837e2a7d248688aed106b2ea5b0458d58b31a882a780bac66c446aae15e4ba18206c85e932d51494509fb823f6f03488e66858da2e61ccbda305f2b2d7ef7cb878c61cc055d5bb23f52b88f0ee7935c0802ca257c516c8921f7788e3d572356d5ac6b5ea2bd89a724bed0ce161a3ce9627d8f8925eecd33a182adabf949263eed87dffc7e9bf3ff24b03726276f333d0e0af99bbfbf5bea8b7a5e6cc9df3fb6da10bf282bec8c030202020202020202020202020202020202020202feb3e0cf07eb3feec1fa57c3247e00be133979894dc81ec1826d9a7dd14dbc1a43f9f2e94ff9839c79af78f8c7201ee13ddf82e4503e3cb497622db2b88d5cc5bf619a10e20799c885fe7965e68f012a0bbcee30ce5f841341110fad30cfc546ddc64f3c4fc6b5b764c1f2fec758c3b3f22f394b11497f9c8c7aed3e23ef3ac598ee1036874c3aab96df911afbc7d3c3eb09fdd3b89182fc6ecda4f3eca2d0da70bb6e5c793c45ff323f08acec259e49fcd558dbdf2398b3646fdabea85ede358712f527ccb52c4bf4212d58dc1425aa3324f7b26ad516425259e7a896911c14131369d177e88f147556fae3b116acee874aaaf676eb181f4d7f2b45739b687c8e9b548c7579ab20ff70bb95523658521527657a2c92ee88aa231f4d32caf7eb920d5d3ebcba9ded52a9aa86d5adc020d0a895622e4aa617955575acca7e9b69501e5007a7ac587d272d6fe22167b26ab5bef7cc9c9a44ec7b955f0d6b8f9d3e1e52bd1ff003cbd6f0e296665325879bcada514e067d378b2e1ae5308faabeeb0de64174159d8ce9eb462e5065696cd858ea2e27e575a0127ad3be4bc855ed6d1befdac843c1b2a229c82bbde7a1dea167b3bd32f78c25d75c657dc9da92b1b68056d75243451e427f49f67ab8eb98ab9878b817dd55b3e4a8597edbc02f3d4eb0e670abd297dd9233958ef022edadad6e35590d4dd844a63ab92bfcc01f3f0de23c453c44075cb5b53fe828903b4f6ec04af878a6428f6730ba546ddc42fb2b817ff5c2c3a94657e0896a0f6d2da5e7e15eb1a4d8888734bfaab63dbc1c0f19d7755be5aceb044b668a774f3cac7a1cad5872531fdd992944b9e3613fb7a41ee4c643863ce49e877bf4d3ac780b1c6b171e4acfc363c2649eee9b858747e0e161ab7608b384604da7e66f99e7c87a523445de50f34f4d68f03599648fedf0186f3140b3f880bef4baa386a178698730e99e60c83195441eea13f4eb2461ef78c88a51b2eeaed19d5972d5d04ef9707de2e1c793ccb2aa974da74faf789897d05993a332f0f504fa4466621c819197243f42525d7cf8f88c8ba6a1bf5475a7af1dd3736ed73663dfc30c9b1eeae19eb07a82463ac0354cccd560793854d4972bc3abfb50ef6b361cebfa5eb3f4540fd54d76d0848987974dfa320cc0edd41ec657df479dfa3c39f4acdd27f978c818f0323975f95808d15479774f3f7e6d03c3455d1b53773939d044054faec93b262c4bba1a83ca905d265cd7d0a63a9c66a0d5421a0ea4690e7db9abd398eea71468a6d3a9d490a260cc57e6c3471f0b0dabc04ebeda6cf2ae2cdb5e33d550601b5101d3d2aac56d84eedbd6c41b50b35a36d3be482c84b9fd3a0d994e7f50d0ded3fee376e33f91e357b1dca7bfdc829d7e6f742cd1e5afcb26cd6dd41f95a8e4cdb9225362d2c846556efef1fb14b1ec2b499b14f7f1b45ba724a7506abd1772a79f6aff49b7b7e7e250d3a0cab9cf4c25315fdc468e0b5d552fee7862dda104b7a69156f1d61d477c34317420e4dedd5d0aef6c99747f2d319e16b1ba6def9399b67b9e0ea4c80cd41523d8ebb395dfa71abfce4b76f8cfe90ebc68b5b69c36f0adce6d0202020202020202be12488063974ec25ff9a597b5aa7af23de2fe58848ef6192f925c168f7621c6d9066b6cb771f252bbb777c5daa9c892c5bfc336c248f4aaa4a5e0ce200ffecb724b9fb3a6c3ffe5635ded17d968ea663ae6ece3a4b0cb5bb15ea52f12de0fa5179994a39b1af1e24c1a2ad41a2ace72845df0b33c57b87982b4986fc2449e4ee5d42bda2bdb13cee42696b6c6bd9d205bc4df8c79f6220fb93381b4af4746865ec025d6b6811f06a02d1bdae3bd7a1d773433f7928ef230e42ef50c59172546b5caabb66ab24d369fc9c5a8649f4a4d9b7312a844eed5a5d6d0bcb22c865f700da92a933a63285826034d1400c898c4cc426b89f7d1e316979a29d8042abdc1d60abe4c7ad063dadf5eca02ea71aae0465d390b71c1d29356661fc76daff2a9de84872a013e95437c499988e8782d89181d8ae487dbf1903373286eacdbdf6ead66e3d45e6e697923476178c22edbb6b85d0dd387dbed98b26a84ef7d52dd6538ce437d3b959bf49cba157d275f1e6373cd471412f4a350197d418907c7f298e428db30fb4d6452c88bfc9eb06ed265437f210fb1cd1550797fe0e90e1ae93e650cfa467fd4acbae56caca88b4f83682f8aa5375503e1dd20a004a6af2a990dc96792f3069a10486e5399f85b6d9c78d8dea6c335c5c125a3e3b9aab6b2800d64528c4e0375514b2687e92e699a753cccaf3954ba93e941b1e46ad26edccbbe94ac6fd19e9fbe27f270e02894ea8e7502afe4790825e0d97b7ec9363836862a86e3b1ea5e764b92f20281063eed0eade5519ef290491dd547d383105030daef43c3696896b53ce44eb037cb74ca58776dfabe1f047411d6974062418333f2d009a5baf158740f1e0a96ef5118b0493b847f8da92fafba25b73cb42a361754e07032292f1bfd709914a1bb258c1c07f6576de7e588d675b61d9ea5a9329878723a6b6d466e7938d1c9f0d20e739c94eb83421ee68e87c76d7808935997b3bee3a797c21a6efb32f99a44a91a93257c65754b48c868ee9b9c68e647a3b4566ca88439924cb18b48128a13991a2b6ea01daa7badf46018b543eccb458cb30ef0b03ce6aa3e6443af33e8f4f51d1e211e72e2e175031e32d9147963d2cb2bd90857aa2d94628749abfaa658a75907f3727d877979d479615e3cf3fbe8f665db56461fa03556061b5b7280b555d5b3bc1dcb52b3b4cca0635725ca78ea41b01ada5adac6385e974694655fc2d094b4e558a54c57ed680a582bc1203b6998ad3f7cf8c1a5a81aaa7d51bd14d189b13ddccb3ed36dd54e3062dea1239ba245672839be54b6c939764c2b7aad34f0047f701e6b4aa15bd0dc324d21b5c8912aca7b70d5072b46e4a156b23559ee3606caee798496712e985d547efc5282d6ffba34d9cb7999dbb711e8e5567915499d53e618f6631b49277e0b71bb4deff82ed0dbea26f3ebdf816ccc5f10f2f06db4b7fe0ee8b0e16f54fb85a4737feb5dbe611410101010f03b78abc6f3c3c7a67f7944fa3f43f11b3184934f6c250b78b693123f3c5c6f71d0ff8310527cc34ecaaa0d89c5548af9e377ebe26f2b1b9f37e4fdb04b402ee4df5aa6a172dceb1d87955608aff2b788cfd8b34ae0474375eb13613427fa41d6c4e3df0a2aadbbb2ce5fabc1c924ed70dbaabb34718d4e51d80821728c23b1090fbb36b2ac70666dac3b5b3b299bc8dffe5c2044e299cf57053ce5d9e6abeb6a3c4cf7fad52d3edefb72df315db4fdded05ba8aa1d0e0313e96128a78f57106778bc96de8187790d8dcf240f3b29a83d197a3c41ec122344dad7b0853749d777aceb0d314cc297c6941455a451835b62dc0f6d84367a302aab6bbd811e2c8a132b397469f1eaae3a764cb6236b2ac9f2131a89b0fa2ee19d9442f38771dce4ab4ab29312c79aa5bb78b19342c9cfb1aeaf29ab6fd320c683692e096b8b6638f5657d3264084776528d39353cbdd6e65a5bdb8aa3e84e93298ab62eda0d4491683d76cc9aee1be321aae8960d43091bfe60a8790fc4de533a96dfd24e4a327d3407f8844b3b646ad7a114323650377e51d694ac9d186bef70d9e2b417936d05d9498d138eabb272f6293bd4c6cf99be6cd2757836def6837eb92c104cf7fb2a6657943e17d63e055f6f91a77cbc80874e0dac8d8fd9f556bdc1d93ce61767273549664e7d3f4cd3da4e0acfe3da9415d64e2adfb775c262df0e8fce4eeab8919d14efa6c3fea5cd2387b1a49f3a7e4507d88579b69342f5838f3f14c685536c799846bdd5ed58d9492db66637b406ce5fd94919e221d36973334f7652dbf1107ff66932bf6207ad75cd3da3be7c4b2956154c2dfc60d08010fbf2267652923cafeb1bf6654e7d998853673446b967c8c31c9344fcc24e6a82d690ef73b443e96e0afbb2b93ceca436e0a1b5f9654d275ecaa41234334bf6aaead10e9772f415ca1a13143ea2c1d2160425c97ec8b584aed1452424e9e60e63a989a64d92bbb1d516659e5f6a6b2755adeda4a6639757a5acaa5c8f2dafafba9bae82eca4eedbd949994b3ad6e5fee5dd4b9574b781e557931425e36dc7f29b49e0c38be19ea4386b7f34419ca448656bba115a524f22a97c6c01358bebb64d61b958030fd580d7bc46133e686b694dec3709affaba6d349370bf5798adef0699c3a51ee05fa337509dc3e170bc1d86d726f148a9013e75230eded05ed186af1d3298a04d5b765bacb1172537d22394cecac75b9bd8bda7dd3e91d58977602fed3302c743520cb22a6dcca931cac5abfd5667a575f7dacd8a537c14f6c88194fec4629cb2897d8a5f1e58ed43e17e7197f46427b518036116e9fe10682745c5587545efbf9f3d8adbc64e8ac592bddcd85b0d54179b003f2e7eee87eee926670ef65b0affa19c322c5b3550aff8ea0e3e844fb48b8cba7384dbf989a3d289741a9e8f0ff2c17868edbebae59a1cf7fdc631d053be013d4be5be27facdf19b738f55aef74787fcf9c215c01e3a9f1b90fb7f6ef31519fe81e522202020202020e00be39b0b954f8aff47dffbfbfcf16b9b977bb3eafcf19d85e0f15f90ebd1da5e2535c5167f8f958d961751dafd89700648db6c9cb2742dd7135cfda85c4fd63f1f9ceef7c1d15355b5bfbf7655c3edee0ef9259df8945b7b388c8228365276caab68cd0ac1f0e4ea47c01f72bd3f086c6066524d5a1f5f77ccbced295ce5742833db5493e2502a26b2e150984ddaa19c0cfa3fd4c847741ab3f83f144ca72879d6b9ee38cbd30e257d4aa739c37f08e461a2f334e724c3d5d6cb88ea984a649748de75dfb4c3f975100f0b3174ecb5babcb91fd1d6acbb76aa2c68cf97cc9d6aee428e13dad47d303996262950aea72e35eb767a251be5e65896b78ed5976214c36dacf6399b8ab2dd99aab5366978067bd8b7e57560dd5c96732a51ba929e4477aaca7d35c2bf2de47a285fbe1f6af5722fce815f685b7118a079a0f741cec9df97b7ad386ca3726a7d4826fb0e8d613c0f39cfaef0cdea4a9a0bb4bcab261ba8b610acda4b3696f420caf52ac9d2bd2e2768a4a995eb1d453727781abe89cf34865ccccc7dffda4c02aa233ba92b5a51ed5126656dcd0a93ec35471b9f8fa78731efbbafbe8e7464e97d4892890fc9f5607099fbbe9f26e9e57a03c9f5c80fa795eb2597d1e8875ccffb4cdb8287b6c0dea4f3abce0c4310d9f85c31b2ac93eba1bac396723deedaa1201b45b196eb1db5407f7c24d7bba4804eb4deef9c938d3ab9de2561babecfdd1f91eb61bce204cff8894defdec8d93c5e3b271b75b666d540f2e5eef6e1f2659ae9ad5c4fddcc3121ab7327d7cb4ed697690d3c4c30297ec8f588879cfa720f33e13d57e40355e17db36a87c7fce3fdc1c267ae2fc96886cbcb37a2be2cacfbc8b923e963cd787cecc8f636ddc2f696c749771c122da79ea5b78c1ae49c265d978bb64c92a926b91ebf8f4972306bb91e7772bd439ab4ad2c216f53f1e19874d5456ceaff103f9ea96efbf2f538417d1946a622a3f7c915333006a6974cc1bbc46dbfc14281e9b26cdb324dca8c8926c5de9c5425a419a687713440c90069790fd78a0d38cdd45eae27878e4f8d19fb9c224b379ae9a6acd351e6a38227e0cf527ff878684513599fbe163388b2bccce5906555d1eea13f1f0dcb9aa2c505797768a7760b47c9e86a002025ce5732a62d12a5c4740bbb3a2df26486d1e77173075d9a59e54d1ea35c8f93a771c88bbf642639ac6ce1391163491b79f160e8defce5d7215bb324972ccb71b1caa11da2d919ca68b9caf3ec131e07d0bc1cf05b107dfa954c96fe0ac4460149fe5b08cd3020e0dfc7162a403f5cf1b75629eee8fadf90702c8a377f1ca451f6da6a8cb48298752f2dbca690550e721e9f3f1533b957aefa0b359342df2bb560e1f594487b6f258692dcead47d2e1ea21ae2760a86df0757f137c611c1b52237e83a77c1a3b8804be4aaca75bc150f35ee8d16452dd84725ae0bf8dd295fa9d3b977b077cc432ec4f9e39b931c88fefb7890265cd2ef5bf35a16109b4b8bba9be3a13a24d6695ad1eb981900002000494441547daf289e54554de326f1a49830f7b618c9ffa1b00155928b6df5e4c3d0b93324853fc1bd3a9c55e56469e259ffd09eb32aa8923d7bc4fc309053b7bd699b43f9f2b669263c3f34f71c1df62175e925cfcc31ceaa5ee9aadec4f83639a53247ff875038fa3b44c75fccf2c23a84c95496e3c61d8d6a541c4317915ad930815a710d29e83a11fa4e8c5e8e9890e8ff50686d8bdbe0fc106372f55dd2bc94a72841675f473c7e3d75282fc283e3ec98a0dfa7ad7cf729e4db38c417c36294352d3ed35877dceff71dab8f873d4b8ff7e3a459796ff757d3ee23ebffb068645515fb53cd34e4851226681c79a4bb68d8cfe3709fab8f773b82845df3f15bfad862254f39e0416cf6077ca691772af27f98c317f37ee750568f9699c35da4a74e68e0250aa5fabd662d7cd0a6a27e3fd5a23c66deff61520bef336d4e5972362cd97db8bf2ffc74d2ec6f6dfa5266c8dd19acb535ab1f7652cd56f214043adcbcd7c092fa70a0d58a6b876cf17f5828e8f0b549cba3ec4bf1ceff210aa5f2e436a4c2fa3fcc4f2a3933f23ba7b7f03b47d2d1b6bdbf8ec945ed905b79cafd21937ab4c30f27889150fe9a522c2ef47fc8977688c66670bd73fe0ffb61180cefd7befb2c0f9db159d2dca0adb6fdf6fe0f2576e2bed32f637271e7bb6f8fe79a6714148912c7c35b47f6871b8d87d01349eaa1a61a1aded297d9a31da2ff4314e8009f5ff0108552b704d7bbe6aec60627a9c5ffa1dec075a86471d5886ff19065b29c247cf44b928d07c6538d36edd970e7b26cb3fc60365970e537a3d1475bdff2f4a8682e89c8779b6c1badcb9291ffc343aff3d1b066f17fe879581e133d14f100794d91d5479db7579853c4667d9986ef662aa7f6d57828dae970c065e0305518c313c5a3a6982a8c27554ec5106fe38be0de96e8ffb0806a5a8342faa4b0fe0f7553968d66e998719e9725da94d5352caca1e575a5c4add46844390e659bb07c2cc7b2c3d8818da95472071e568ae9690b7361f8eee650a62f6758a10912175612372d38f368bb3f11b474db82a0585baf9b0a3d992bf27fa86c4442f4890d74c4e4341bb2c1a0994143cd50cca368cfaa62096cd719edad88dc0c765a0a97889005f682eac34d5d1168f698bfdeaabbcd92774021c88d0bcde63ef7261fd5ee479855d1a3030f5b9135d892922f71a46c84729b89db4d0ddad2e3a6c5f24af8a26cf4291b5c6a0b8a69dbf9daa7aed5d674b6702e1af87204b1d1f6dedbb271fbc2f6a488b9389afea8c3b9aef7219a17af234c0ea9fff8cbc1883798dcd04cca56fe8df7f13b7c1f139c7e8825613b8a7e0ddf8a0a1ff0e3f86ce771ff22fea2cfaf2f836f4a3502020202fe3d78f1a1b7e177abd047e0d3a70051ce33a30d80a4627f8bb9a5ec3ae712bfeb83e925ef1db160ff7759e55c02d82d8bcb2cb6f145ad8d5ef883fcc208d48ead3694b07370615d85ac581393cea758f99c10ceed88758ab14dec60ac479bb6e9bebb24480dc019806570055b7e9918936f12938ba75594dadd1bb3eb3d345359048ff6f389c74ece3d457f2f0ee75d0c6bfef8e76f7cfcde0aeaca8b616ad1a5e1b77319539b3a22adf7ac6d4d557261eea63fbc0ee4f59b9065877652492319ef3bf6b04fe1221d1b546b4fbb5af0144f709849ba32655d691537a549789da4250628ef46b8210d7ae4a9456ef4582bd5f45bc4e4e2e82a4bf45df7d2ffe11a75450c437f7dfa962874f3d894db2cc5ac8dcfa16166a6d6e86c2b44734ccdc5b0fa3419514edd70ea58bb1fccae1ccdc92cf629973ebd953c3da5e96db0b61537d1cd535aedabb42d3e5e9c4b91ca8eba219f30dfce067d2699ad3b333cc74679cad6fe0f6188d993cf34bef27f9858ff874785622686e7d76813e0fc1f32eb33ad689cff43c1b264b1f199354baef966363e717fdb8fc9776707c1d0680b99883e2451c842f2948de249110f81b27437d859ccf130f7befbd04e6a5796e3a158fb3f64ec6127754cf2c3040341f6d6ffe136b6664064524df7e6bb3918f20c6737e42107aabd0fc90fa785793b29ce4c3472e7bbefbdffc3639e24b95efbeee3d6972906fd43af78aa1b6eb5a8fe040f699aead3fcb53cc5671243630dbe45595bd9e866fe0fd1c199b77924d3ac879dd4ec7c9992ff431bb5b15af1906ccdc84e2ad9e73a26ff8728a032b7275bb30fe7a164f16858dfc5f3770d88d0852e23dd307323c9a3de2768e0f5f167755c641d4c065daef635eb2245f3f26cba344d785f75dddef93facdaaebb593ba9cad949c13a17eda4f66957347c2cbaa41db9b92429fa3fbc38ff87d77c837919869da36987b2f8deda063a07cd3a6dcad4d47430908bfa909afd2b1bbfdfa6478f4ddf8f6952931a17f93fec1b8061b169c64eb0ce60a029d3341dc5b985d52b34393b2f93ff43d3d41a2ec7b1ce6035dbd4492d345cea1add21ea8fe721aede93665f99ef87d7523559610fc034d53440101369d3271fbfc6f62ed9dcf93913ebbffd82997b676a6ef7b4def791dda89702b95cfc29cf26fb1406ebd2efeb317b1d58e125549ebecf77de69fd1ffe69f08d7c02fe1d7093fc8d97f9522288bf738ecdb7d887ff3dfcb5f6f08578181010f0cf639393fe1facfa9b7159bc14626d09628f01f8f2eb33e1ef4d8edf761fe7243b688fe084114e91809c65f34fb7c67e1dd0e90fc0ea9cbd84b07a69c2e92b917cc35e2e41ce3621297b3edb15d9220d5bb06cfddc15fd90deef1c7fbdc6d950eb2b4bf4b7be60dc25fc4d4c2eb8c4668931b9b6e9cb22ad126f036a55da5b459fd20b3a85ff6f91f239f9693c74cc4bff7c26bf57167eebfdd1e46291326d6ff7e6b5df17ddcfe86e4e1555b34f4972a0daaa812d294fef63bb4d4c2e3116d7d4eb1732f2f785818f98f46266fa69b3aeabe76cd5f85cd711efe47a1b30114fe76ec968aac3abb32f3ed4645b314c3127ef50187d2a66dd55a9c2083936db34c38ce47a73ced0d3dce31c5be8ea742d15ab8bf220f3c369ae059bfa72deab7246f10ae9c0f262ac4e7b8c8274bade3585bfea2e7177afaf9734bd5e8dfc703d583ab4415bb3f8b5df39e733ed826df08a3f489eb2754c2ee4a1800f27fa8aad7ca6c962945935327335797c344ced0d6bf779b6bf27b2e8ed3976caa67d022d396eee9cf7c32293dad5d2c0bff4f8f1e78734da5c4c997ec3a3095ffcce91ad19faee233b29eb336d233b29270b906d5b915cd9f35063aca1e4a8cc3d466b8f5cf7ad684746b1cd86259e5481b1906e797d4b148b632f4fb96a78d2caf53e1c382277edf1debf16a7ac79b8c4e4124b5cb39bda649e7332a9243276d9ecfc1f3ec9a4766dd54e638cf214e7ffd0f1906452b744d6f77b993d7cf7e94526f5d1b0d1dbe371685fc64202facbc577dfd1fb90c426e97d486ec64340792c325a8e389994bee4d86b14f230dd0b2961e2781fd7ccc946d13677aae21772bd0f07ccfe3a634d179fbee7ff10656519461563a229e965343a63dc202617562ad52105f698433cb65e462fe358c6372362e8bfe8ff505d53818a20d5130f49aed72a6e0ecaa0e0e50625886cbcf025aed9163cc4b9ac557d9a9c5ec686cbf3ea90e73cbf987c2a196f3a0697495b713114498aaee83e9a1cb4c06aaf8732cd6100d1570a40d9ed2a181b0d4ba7a69c12f8741889f440d7ebb866d6a76e55f4fd1df2dec70646f0ee3636e351aefd1f7e3cc99ce555752f70c9f7feb62831a058af585ab67d0c2b375c73408246f5afb64cbfe1aeeeb728e271d7a1c7489da0b56d8e6be32ca18084b0b8e9705daf2191cbbcebe0b3e7404a8ea66f392d757305e361dee540588e210c315bae12a11209a5481127df97bdfd12c5b87c515d35e42ff7cc1c7a908c71dc91196a0fc5b8778e63bb0544d7839b2c141e4a8ec26d57ec3de10479abbda6e0ceb183dbc0c0250dd842485f9e7fd2ab587ebcba9f951ec2d77da9b1c01ff64582825b31bf7d12822dee5a3e961ebe54e8755cd7924feef76d9c7b06bbdd9c37e6a2a0b2ccf259584187df35fa73a80f07777e375eb2832f7b4cee8e6e980d95e5533fd7b90d2335ce4f47d3bf864f77a6f92f42047bbddfc5df912f070404040404040404fc01bc7302b2ec41f8fb3c4f967b6f1789af76c97c9591af1e646bd1a1f81615cf35bc278c2f19d62bfe7754b8c23f7e5f10a3632a45e75b095ce1094c9c2479a2f11441c3451e53ae2449344a8d35de24dfa790624fcb145c2578222a72cc6f93723468c11d35150185292a02abc4a444a25947b24aca13cc25a8544ca222d0524152a98292e00afd69092c8b68cd304e85c603199d3bc224d5bd908f84b922d02a169fff681ee623a08372e37a1ccb01ed8874398e2dd9d59a722c49f8a39b0692f00b1abc497495cd58d678d6d341d288ef1d0f63530e788293405289d60db1c152159e4e8e2e89d5f8247abcc58aca14db463a36e38861d562cc454ade542aaa0f2824acc62f99c0832d1e14f31a6ef619918f49c8164c2a314961f106cf9b5220bf41c2548f4520a7bb36f9a6a2c92f43c40072a624e33823910d266564ac2cf1e692843ebe28c96a93c474d33e18c7c22565128fbf281725e195241d099fc4307b469ae919dec4245b049e6a51a90b618fa40761c88a27c2628aec4855b2858a27c22cf9f68de49752440e080808080808080808080808080808080808f83efea205eb97c1977233f2b7f04958282d385de111be05fe8942b3b5a33c97f2f453f87421ad050997fc51e4c610ca5b9db8d80f4880c0bad74e60b9dcc6ceec811e2540e5a0643a8e4dc215fc8d921d26c726675c35e9126641978d624c0fe898b32bd12d9519c72167aca963c6bb52e5a5914c3579ed8adc54bd0ead93fa7ddb912454d528811269997269cab21c896a359403b9d342b7a29b1103f5d77d154d83514d34f5fb6b2aebbe88cadeb02e8ad08ce7dc389faf82d551d4a10515a657d141cbfba96daefb849dd0ede68091e14e09cbe7cef46d74186ab5e9800f049d0eed810c7ef4e10aa489f1741eb84c9ba6897aa4ba3935b79275bbb1b8bfb6d7fd1090a17e1a19063f7a21e4edaeb930114a11cb7d3329a667cf43ce6e1545d1bbdd2aa12efb83aaa354f07c6ed96de1e1b54063177261c7360e490afd224ad3bc474b983c35bb8ec5757e1bc80ec05c88b3979a0d3b35162a2773baad08c1923be4e188fefb8093d037ea08fa051a19cd09d3a7def190255167228c1c575ff3ee321eb2fb41426b68a2f806cc16c8c35bbd4bf4051aabe5e1b6ed90b3ebf5900aeb8520dda1005b5f06ac348e6aacb9dba5cc4479318a6cae37d61f5f788851b952c743a81cbeaa6b87b40e1b2f3a05aaf26bb74fc7aa3e64fb02c3df0e8e8735f0f09297f7dcf3906daa6e8c14e5e5259a34397f451e0ae221c68fbb90eb01e4611a25c8c3d31fe1e1801d98f530bc100fe3313a1ce67d4c3c24bb10b59fa743d4220f87ea96d6f7ac3a6a8cea7991d097391fcebabbe63a6a6e0f1e6e096062266a3337e4e60479c88987d81a4752bf494e069b42554ab5ab3789cdf400f130394f30d19e7164431eeaeb98764da4a12f5b8a59771ebaaebd64f9a9ebe6281bee0a8750f8d00d6be78ea9db21eeae095c9fff100f59724c52752b69d84dd1993253175436a10129ee747c69583fcbfe18272e4cea76401ec2973c475174cf99e5a1c1feacf795baced7d35c64d0d9cf12c3b2d6d00ef5b1e2034c75e32e8ace2d4c3c7b78149a1ff2509d22e2e1e6ee118125fbf972a5d923b91fcfc72aaf20e19e32f8f4407b3432739ee1d5f2db296ab34dfb32f4809ad4adb431685dc9790eab92d464a8fa636274bf5fa752c429f97ca83b556b9126bcc3e002b9311d92a65293e2d2d1409fee6a8d7efd3fdeffea5bba39cbd26ab0a4d7e8e25e13ad39eb6a587967e8b0b3ab3b412fb641e4ce67629e2913dcabf52d11c198356114de50d2063af3e69bfe973575e4cbd5e664237bd611cbfc96c5efa3bdafa5d5bdad68f11e54176b476bbd4861281c012b5737dc45a8582c1c6dcc0beec255f82c7f205c3d2d16bc5b25ee57a3cb3b78275f826fbcc85a68614e53d51bac3aff596c21c842f2855bdc59927aabd78709a98b04b231d9ce3478f9fc0f6b57eb246d315f15e1842c20202020202020e027f032d8f4bb05f20bf70d2fdddbbe5888adec6a168ba61f289ebd702ff73e1b7f41c58b37f261173efcf026b6b64a688e84c17ab0f8cc25a1551100ad45c8144a6348174ceac8e6c35a34c1da954ca7944b4af0f49bab25c95a344152b6184525646a0549d6200b93744e15593ba9c4ee7ec9fa8aaf09730659b070c7ec64146509436737982b21d9982d82eca4a0fc78952420bffa78496a5e4d55856742f130555389ef9d1755852ee4b880a4aac597ccdb6a2a6adc7ed49074273b29ccd5e31e2685a48a0e9d462c02737578137db1c5fd344d25ca3112c854d0595803f9272c42e3458def6df00a1d8d6640ce44a1a2a8d48ea1400c93f0bca083a482ceafa0a28a688552a7c2205390d6029314d65d23f9c613a6cb6a9a1a34d74b8bee1b9e137f0322cb3225b1edc47041ee6a3029c3037e4cca147d5bbc88294e984fe20ab39185922d02923025632e897cf5521168db6473910514a628da122a9fe44ac51355b8a0f315e909230ac934cb2709573726294ab284a915616c4d18bd514cb954bcd926fed510f6a2aae7b39177d73f55d8af3ff84384bdccc5d9a773911d101010101010101010101010101010101010101010f0e7b09c925b4d34e6a217f8bf3e2316a5c215a18f680f4fbe26b70a01b182d3dea3cba7f015c2eb656e5afdafc0aa8a5ac2840debe1e85d542319738a8736b8e2b64aa5efbe908b34c2adbef07615ff06d64accbe89f956c09644e1f53b1fbf362348a5c340626f96f6a9905cc86ee88d66b119506f7de836acfc1791f437a316dee5f5d04163835fb9fd2bb75ab8d20c9de44c9921d930cc2c99649dce877d84a273798bf69a315545c5748af26c9a15230394cf86f47cbf5c2f5ea1bd8b6ef7a864c9e9788f5296ccf00b0d7e98da9f0ed1c0f4f17ad8d65e8fc5b75b2af5704ad1aaa49d297c6689d100bbb8bdc468f5366c54f92f43f4175d76958d9d26585fe46a9ad910e5fa5e89f296675189dd2a8dd2b8bdca34eae243b19d21308528ecd1a36dae386f227d1925cbafb70e7553b2eadae5da9c3f1f0f87a86f99b7f3164a31753889762fe4b823e3c13bb28c0f51ccea48f757cd86ebc7075af37056a336f892de57ac810a85b9ed4e879a655534cff3ee93f5656c4e7a8a660a0ec8eccc9195d0e4a603f0308ae72a63d51dde423611031ee6e345b37aded4e628896a5c1fc41cdafea04d84fa4632a9612491d535edbafa93f565bb60496e07a294c217ebe26c989a0e127978ad149b0e9aac82d16e5d230f8739df724ed15185314dcb4e94e7eb7cdd1d786ed0deedb897d5671c0fd14a264d45a9afb67f08a6ee4754e91aaf595cdd647150ecd2c64222ff581fa97aa759797c1de8f5632842cbe53635309565bb2ac9f336cad2684abb3e1a8187ea13f250b0b89d4d65226b9aca591395699a4a13d566d730fc055d6b6855b21bd3630183559fcee5b66e31e2fa1445fb0e3e1b768e14a618738da25d1bab62f729d7365cc07878de8dd6e1b960f70870ce614a8c5a856363d44a48cc81745cab09b38b8afccf6c5a7d1d2f34713f1fb2f2ff66f98c647f2a882d02ebfea7e0cf6a027e1d7fc4b6372020e03f07eba3c1999d3377b2f9f6df232bb3518dff3c9d4f5853e065010f4a9fa8fe23cbc2c578df7a19602e803613ce3990f5ed40595f4631ff1bb02e2fdc99c3429c778081517b9c6c40ca3f41b28d5f84fca2984136e410861442cb1a34eec11486563382a13d4d6cc3126d4fd8f72032b462730e31d090c7da2ac5de89888cc920084330fd11524537b6ed9033551920cb541a8f352b831e81ca56719696b85f1aab6ac839336d5b0136dcc1ff0832539dc6ce9f7dc5755b353924c26b58c2f2b1c2506109256cdd10b178b3bb366d74d32a42d75e0d3a58ca4e111e747427dc2bd7270d7be94b5346c704f6f7ed30f4fddfe52137d1783f9c2c1178be550e973b1ba2728c4ae2ebf1d29f26a9f7f7e6546ede10e11ba9e880ecdaa72aeaa1b63e4a80ad738f0710c9657f4d587dd1dd6ec2665925acdf5909d55fedcba2b9a952f7f64850b076d6a2da496378361dd10810dd1dd6e70efd6d3567b53535dc9ec1527bd75195a66985edb0d8ebc3849e20d35b2beaabc6231d91a9380616f79029d9dac1eaffa1da4413cad06c5f66f9a5ac2f7840d7f517322435e70ef958d339f6f64eb39c2c40100fafb7dbed0a3c4cae3d1d607673979e3be261c2547b287ad147b7fdfed8c45b13f67da8fa7ebef4ca9d7de9c3beb8a430ed4dd73b71ac261ed6839505fc017ab01dc2d416030fcb5ce725399dab860a580b3c8c0f936b873235c742f667a3b4567fb12b5b6b783d0dcb196c75cdb3f20c139f4a0e37fcba4b3b947fa21d02e21dda4f271763c7c321cae32aba9e4ef31dfb324be709c6c373854a0f05f0d08e877f7338142c6b6a59aaa33d5f17e2be976c38a76383332285d104f69a7382e3611ffd91ef9d9e4f63b59e979308a9c38b1d34bf32bae4c0d9cb38ce738d8283a16ffabf797a070b6798828bd1c9a438f069ac2f47d547d5184da28496b7bff4bb4ae8fdbe99fb3f7280cd3b58fbc16a454db03ee466d269613d08a4799b0858648d306f9b12f224b03ec4d56155fc4df51158f0abbabab6c66d4a585c57b81c84c4aad1b082cd697da8c95d41bfad93ee0724454115b82b81fd08fe8f3b3ed8b6d00e056fe2ca3fb6ae09e20cfeffcbf3327071f4ee4990561f381623c34a780bf821488723fe7c3a6b9f085b7bd6fcf208f12a7e1fe20fb8d60c080808080808080808080808f8afe3db8e195f277d4f0de307937ecc3de40bfc7a953f5ec74fc03a2e451591586519054c144a912f53546e4047a4948b6e023017b90c4547a494440f3a5fa63e97b445e0691e5e093a9274b9c89769860fcac597295e41455c5045d6972915e1caf7be4c3d61ca2779f20511962de4c7befc37e44b253f5e69312f0029be6c73280e2df9a9bd1f8a3b99fc0c87a268f1c43fafe0261e70334cb23e75ef4571a0505d295c1528f4895bc8657deae24d3ca5cfb0d452a325d6044924401aa1083261d27071a0006e3526a14fddb880fc23e6c252278cdfa8464c229fba07208c7ceab64818d15a6045689dd4d852195358f7806a3706aec8164d23610d9ef2a487eee31ba2d400748d2b145e099fa4c845335ec925093ff7924b50122a36657885cd896bba092f4449f8daae543485f049cc1521b8abc82751a35b925ca9e879972ac26f648b4077d29e8ad893ff96b02549ae93a0d478a30333feded32cf50af6c67d2e7f6b09ce9d2f6ffefd07d9bb51887b8fdfcf55bea7822f5a7cab92c4dba7dee9f1bda0828c9949c38d0504040404040404040404040404040404040404040404040404040404040404040404040404040404047c0bdf50d87da3d5fa9d5cab9ffc55ee7fd584fe8d22ae0f3ae5ae97004ace1da5bdb659850b5225f812af8ab1f5a50f9a6593850d6fe5925ca5d6cfa57f708918f58fe18d0705e1fc76326c1582af3d75722e5d801de71453d8fb8e913e6096055b65a187b875fbb92880bbdcec9163158febdfc2f74c3b1e714c5e7656dbb028c526ad5edf71852d05f0e511f8a5f2dc33962dcf3f857dfbb7808e12d7b8e9047ea2bf25e0500f7faf7391310abc6c09d7a5352aa822f411d84182f573a52e513427967df13d8a2a32c961aa88a2836292cbaea07a4e0dba8ae4a2864be799084a2dfeb2e3bb5f0372e70c984fa7197e45479dcfa7c83994aca3f9e872a5d1e9b4ab6cc83b3646a7f99263b362e399425545a71d7917d5d36eb74f7c73caa37947163cf0f87c468b1f3546bbf91cc18fe84201b6962a3058c9b9fabb8e9e7e1182c525e2369f6e23fc1e54f2928787ddf5341ff38587a7dd2871645c7838a3bf5935edcec7c47752cedaf3ee80863ed97e178dd8b2dbe814ed9bbaae76f3ee8ab57c051ea25d1c005e7e37e19564af78088d75374da7d9d82905dbe17ca1e6b6e621931334b0dc0f7be806f23ac30080ae5d771705bf0db0b0d592f12cbdcc3b74b6fa257868bb9daccef364bbe04b1e9af3b94f77e736733c9cdbf3b98adff0309ea29958281673cefa3c5f33a6609cc03e1ddf77f3dd79f432a77967be060f1d8087bbc2b233399dbc934be35f302e7673ca6fbb53e2781875f71d450c5cf110e3a53d3ab285aa76bb9e8dc07d6438143d9377432e61c299cf65fc057948edf0743ad71d0118645f30b9edee9a35300773c7c3b48b669cb31f3c4cc6dd0cd389785e2ea5d7ddbebecd5732ee34f37c73110861acdcedeeeaabf210a6e8cbe58affe33442b7eb793762d8c3dd5d7a1ecae98c6b9d070fa7f9341792bd89a72bdadde97a3a9794dc435726efd764f30b1f417f3d1e32d70e4f3b5ceeec60c1832fc8b147ce3044f2db1c69e678c8ba2bf260e1e169b7db9de6e14d3384d5ce0ca55cc9f097353b9a4718b5c3fa250fffc535b6c3735f9e275aef943005100fbbdd7c4d74ae4b0a0ee978284b1aea161e9efa6637c3ccfdcc43e4d5c92dced9b0c3e511b3bbf406068af73cfc07f77a1ecf7df9cd9c02f3f3e974bb004ef34d7a1eb2fc02a35bb3f4652362985468d679007895030f69fb012bed79beba299fb369de4d341ede1cdfcaf3b9fdf7fb327fac6de80cc13592ecbe3bd99de0ee642763e4a1c0396668d6eb43580e9ef7cfde482d0f95bdd497f9dcd079065cc3c030e08a71bedaee2d0fbba8fcf7fbf2d3fad0f39013174c0d3005cc2d8c591e7226a10d1de6070f3164f2e93cb2b5f53c0c88be1d0adc5dcf3b373137304e4235e98e9689ccaea9ea7ff1e8cbe35d3b44781e565154d96ce969c668d8b62f535f9f4fabbd9e64065a6abf0ec76379486d13b7d3306246462b95c39a1ec656da1dce27a394828d0bed25ff5d267e87874cda5d06a6e4fb1983627b1e2ae8e42b1ea2878a7237a38fff57ed905688a7f37cbedcf7f02bc2202e827533f0f57838cef0dbfcd33e7561a71b1d7c5fde3d78783e626b3bdf72779edd46188bbb743c849e0830c8c319cf6da0b7aae339baaddcbd230f67df0e01295474c6a1f53a287c4088741fd9a45b2ad9bf7806eb21cbcba5b5e1bbf2e3f162e765612e37606c7bbb8cb1139ba4c75ba1597fb95a1eaaf676bca5b0fabe1e6fda3a16e920657ac84b38d7a7e34ef9bf6082eacafb713f193a86a57da136edfe7868d3bf1c44e8b7618fac97a37a77dafff8e94eac57c7d62b3f29fee87f79f271a4eda369fd080d7f3facdaef010522f67f2b1a61240da1be465213cb0b921be11f8b9cc00b53ac4089d1ea59ac5c85bb42e59baa385f0f993eeada3fce4366f9e42e5cdb6b000006ec49444154a46fc21d5d59499c782409f190cd312f52717cf63c7c0a1aca5d38b7a7aa1e0530c774ff29fed4db6e05eb1489af44458f7fbe89f0a7bffc29217f4af437fcd55baf4adf23202020202020202020202020202020202020202020202020202020202020202020e0e7c0ad128c5730b249a4f6b218623367722dadfe105ed807e14a7032d391c2eab6596d1a9fdd3f289c9292f0ba61361745dd5bacc6253d688bb04954237354b85c90cdeb4af9f2a5372c5f347f0411e655a616c2b860eed16d18b9d6cae59ede37490f2bfa4529863f05197b382278cec5f8fbb29e4291bd48624b8d3f40d8fbc2f88bf21f7a52ef18f07bd0f550d70906454c877a30a8c6abfbba1e3a6c0898542b976be8f04b7690bd4745553940528a61f292012e5199551a2c42a0763fde44d54e5baa42e54c28a2276d4f4c1a62285f61a929be11963aa06a6c8c49a4b59e60dd39c668a422509f2ec7ba73e422559479c2907c2cb51e309722c2b0e95111a8eba98c4b825273f6e1ed501b00940b3c34a6b63cace1aa431dcd0e938887f0db74d8d73bbc89b9445d9b3ac5a4048bd0c443b869b0e3e5988bd89ac2559ac16b6345b5e521e68224a6a822e2614d1541c7c4b2486b36a91d611912962e846112c7b22c0fe1373401a872213f46c288fc04932c0f910aa2959eff601e060404040404040404040404040404040404fcb7918f9a754d2ceb711ca418523a1a4e4b32344eeb8ca932c7e3c306fe1a9b71502ce9580d8f1848ed53a6fa31b5b70ccb0dded4b51e626d38eb151f6ac6ead1c44c18934146d94096661c6ba1068d87897507cfe2f96a0d4f19a6a0fe641c473c40ccc7246990b6cf6f56df4539ab772a3b44d12d96c7924edf07eb78613c2896a34f87b89a197ab1896e9a99814d09ab4bc6b27960fa1a8d8cf5117a1c492b666a96dff3834a5ac120ef61cfd83d2a1493d3a4206306ff52c87b907a9f4ff05daa9a95d131666c5fe4c796e99bbd3f29242c4d77093373f29739f4ff413c3ca9b888e05de47e244be3daf110de5e5b1e5e9187bb684f3cac80879031bbd64c5fd06bd500b75ad6b5c4c3435ea8bc14eca8597167ec801c9155a5760dcbce0dbacf8826a90e79d533d6220fefc0c3c394ef4ba68f70ff7c8e2ac7c313f0f0fa0ff290ff111eeac0c30fe7e17dd28187a11d7e82f130b4c3dfefcb5fa91d86befcd3f8243cfc5a734a581ffe343e493b0c734ae8cb9f81875fab2f87f1f0a7f149da61581f86befc1978f8b5e694301efe343e493b0cebc330a77c061e86be1ce69430a7fc263e493b0c734a98533e030fbf565f0e32a99f466887bf8fc0c3dfc727e161581f86f5616887bf894fc2c3d00ec31afb738c87a12f87befcf77918e694d00e3f030fc39c12d6d89fa11d061e8639e533f0f06bb5c3301efe343e493b0c7d39f4e5cfc0c3b03e0c670e9fa11d86be1ce694cfc0c3afd50ec3faf0a7f149dae1d79a97435ffe69ac7928433bfc25100fe7373c1c1e3ccc573c3cbfe1e1e9c1c3f3330f13c7c3fd8a87c03ff2cd728edef0706f7978743c443f2f2b1e9efe011e5e72668e595c5d2e8758a2cf196c8733baf4663dbc8b3e210fcb2330ea7abb1c34b2a905b643c6f80e3cbc5f07c66ab855b2ae64a96179954f2a6f04bb6b514d8c55d71678d896ead6b3ec063cba5d2eadd445dec283ad61cdf520199bdabc68982e7a965ea02ce0617249d323f070fff9792862ce64c6799c65c0b798fc2b3119db5ff017cfd0f7b9ccf01f64e198180b263023e486e7247aadc7a7458c3779cc25ddc6bc58243ec4212b64e4f08f8a615c722c5de2df5454cca934781428c1a00b2213022bca82eff5808080808080808080808080808080808080808080808080808080808080af08eeff7f971cf0a320067204e362e11cfe19f083e04f0d7151531181893f01cea5e052722632251f5d18d59202dee27dc3c2eecb854834eb72c67293aea2d2a954fe49e2fe0dac58c85d97a57ecc449a33953196267c1910a171eaa07ef60e42ebae53224973d4fdcbbb5443f7e590a681873a8b1393260a33e629b64a99071ebe833426e90c30ca748277789d70d6d55d92d639b441c743ce933a814ba6eaf86f53fcf9204dc2586704d326d335b4386d543cc008a80cf210fab2c6de2d3b4c1aa4328187ef200d3027e938f04c7529700bc6c1bcc6c1b1733ccc698dc3559e74431c78f8028e87d8ee54dae152b04b92773ce42ca9d324af030f5fc1f150200f939412725d733b2f3b1e32ece119f6e5c0c35758f350190dcb42a3b84904cb6bcb43181685021ec63026f68187af20d3c77888ebe91478061c83dfd000bb8471f8951921bb14fe0b7df925b842d30ed8c109b8104aeb4cc09808bf552c9982bd1efc135af058e75a2a2154581fbe80a0c319fc25e8a806afec1d9a8f85fde552c26ef935902f9c3fce6a7072e64baabf694fc2c2096240404040404040c0d7c5ff00d8f3205a949fe26a0000000049454e44ae426082',
    '2026-08-11 22:54:40.117'
  );
INSERT INTO
  `documents` (
    `id`,
    `company_id`,
    `filename`,
    `mime_type`,
    `content`,
    `created_at`
  )
VALUES
  (
    '5dd0cfd1-14aa-4829-9fc5-3c35722eb6f8',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'images.png',
    'image/png',
    X'89504e470d0a1a0a0000000d49484452000001430000026b08030000004dfa01f300000069504c5445fffffffefefe000000fbfbfbf4f4f4f8f8f8eeeeeed2d2d2bbbbbbe4e4e4f1f1f1dadada1111115d5d5d7e7e7e6b6b6b494949a0a0a05858588b8b8b767676c6c6c6434343929292989898acacac8484842323236565650b0b0b3434342c2c2c1c1c1c3c3c3c505050bfc9ed000000200049444154789ced5d0b63a3aa120611148d1aa346312631f9ff3ff2ce0c604c9bddbb8fbadbede13b675b8b08e3c87b5e8c73c159c06fa1cb78e0e16fa2562cf0f037a164e8cb0101010101010101010101010101010101010101010101010101010101010101ff7570b6d6c3e1cbff9cfb749f83d33f9f48a91cf15c9c4b7019f9f2e4fa617bc317c196071ed570ff007745aeebb189cf595de9cf19fd6b3c17e9ffe08faad7f97e8277be12c9b910be4cbcb2ffd3a52dd8ff61538525cd26c09f0275f21cab5c8acf0c498f3fec2f4fb278d4640b603e87afdc96e7fea052857f77f89b094b16d5e64917784bfaef8ac4bb0ccbfb2c942f15b9a4c77b73f1d33c147cf53dec6b50618c48765f8e23c9feb66721e30b8796b2b8fd49255a5a88ad78fd449baf83725b86d9e239a688a5b508e1bea17db9a58d596a047193f99cf63f24764d916f0d9e4e5b8b4d12ecf1a119fde99ad3cfb1d0bf005b7e4a4bd753b2a46e22846436bb587aac587d38bef0673d0ed05710f29934c15c1b4096095f9414eecb3c8a129ee98f4eeb6eba86f5e87c0f36b1070f1dc1cb4daa5032fba29e48ff3a02dffd17da216ba328ba68b84ce1624ea1347d83ab16dfba818b0815173bbc304089aae06252f05c8fd913b8a7f05e8f441de0e28ed90d5c9c534852d7e81c95485709493bac267145b16c828b02b36351510ef46778d1403531debb6b57549442923cc34585341758730e853aaa18d37bcc1e735794c29af1628402e2d61625d880491d72152f0a641edebbe24b743baa068a4a7f9a879ca5fdd0d7195ce6fd300c39d0a16a484ab185c2bda18f2193c60bac2b36784f62ad985d43f6182e9a0ebf07de33313483a487b41c92322a0adb105633603558d49020536c765754af8087122f3abc97fa7b39e4ee812a2ef1825ed06009ca15055441355414362c2caa8921296e065bb32d2ac36ae0b126471ee23d83ed8f5e1ef99bdb7bf05cfef33c7cdbfdc5ba852f57ee9e4f7adc13ef06612ede298bf2f7a3cc92c9f723f6185897a4e562e9f14f84be4df133de6a6ef563155b260b1a209f097dd4cc1f35fe04dc84e44ae77e60166e04e77e50b683b05ce6d8c73cf618ebfd8ce4ca595e82733735f86c6cc925fcace147f965c6e7abc17f99e8f9321a0b479a5c0668f1c8b79aa31cfd627dbdccc09e2c3ff53d68fc39b8559aff46cc2d94dc88efabe00b4399af93fb85e3a362970753ddbce0dad3ba4931b79259ad079f5e9b3d3ee9521a4d35aba5ac27ead1e46846f70b4ab614e657983497b86fcdedec4f8b85f52b31bf00090808f86fc28ddf746d376dc2cd818f51c5cd0262b523a171433c4d14761af14334a5b1d570be1ef5dcee442c8397af629945fc40eb67065b9da3d757fb18bb1e53dd63925de618b66c46dd48bf4c30abf1d155b35a84fc0c0fe56a79cf1ffb6462839fe7fc3cb63cc4fd667621d9cfa5629dc6963d989b0cd932f1b87dace38c707b42eee75c57267bec6e17d63caa798cffc2cfe58fbd236d77fcebb035b785604b66578d6535a70a7f96859ea41573d8a3c5ac96556c4df17a327cfb499e733c4dda6f7785ec8907dfac6659d9bdaf86ad0b78b1d87b73f178f22531bf6a04c5196e19445a03706b95c36fd861e02e0293b0ce6470f734a6e0b6805176d85cf27ca0ecb0cf33f550a7b8e7c57b063775da15051b0b4c42ee24f5aaa8a1c32457146e482049d356082e525c0f755026ec3004a7ec5833a7a2b0cbb9a26053675c512c1d2c558ceee14b64981d765558143c87fb4a3550519c497f0fb2439aa60d9aabe66779885b57d9c0b6f6824f77b8c1c52d527c818b33f2b0868b13d69a9ce06ac0c5550517d70cb9139dcfb46385ecb09b859793a3cd0e4561762a1d8bbae0fe108bbac28e952598d463c7c3a24eb8a94be122a2fdf701f7d8928a8aa21bb235d9b98db138c2bd224666daa2608b8a493db6af162ee6cc1535c30765bac0a260f749545da8916035355275c7a2141605297387f72eae9a9fe5618c738344e00822622963893d1c2ea4a2910a9368b0a24cf814dea371142f621a3963788c92f056cc5d524c852a4a02d03d3ab18c5d8562294a5235b650b8c46a6c6eac1aaf70b3cdb225bb27c65e6147ccfc858c9f72e198ef5e1068c06a6266ab89a91a91e12be3b00609d9cf9fdb3ca627463b48bb25582690a761663582f85ccc1f73d959cd4fb5ab517139a395cc8fe0ee38d28fefae78bb0f71b3ff7a58a5a1eb4188df93ae8eb8fc46f769d7e4cf31b1c9adf637cbb6f669f4e3eedeafed52fc34bc2c22fcc4ead3057bdc5bd127dc32822f27db8f250373077beeae5852d7053dad307ccd7e06e68f95827027b6eeed059df02d0f2e0cf1db6e269eab79bc0ce7fecbbf791b57bd3feafe0bd8bad6b7e56f545fd82607040404040404040404040404040404047c20f82ba956c0cfe071021bf08be02fae022c64bc40ba24113fc1cb4b44a600317f9949d8142ce2519e785b83cffab5204ddb962da22c7b9393a64652b52b349a2450b2abdbfded766f4d82bafc2c7fca54e68c1e4b5144ea13c721452de674c9491555faabb56492e49e2da2f3b1461ea63e81126f396a27aaf21a9de779de9d77b701054e49b4ca159d3bab203e4089d7c79ddd94a08ab6adc1a5463faffdfbc9219bf3698e2ce6d32e32d870a2d3295a7045dd075544b3cb36ef4823be834ce747ae8e52e61a4abcccbec4f9743ee656373d82ecaed0e4cbb543e0e125d5886e8297bf6a6c50a7a8a6c18f802a0c2df0e7d2678ca9fe3a9f50b920814c6dbccef4e0e17ccba1bcdcdc77d7a892b1d690a199e7abf159bf169087a4c381d72db4c9d4f270a58201835f779de7a3cbd5dda2a88a8987e3aa20bee6e1d1ce1bfa06bd5fd9fbc36ef6f57c353c78c8b113cf27e379b812c9cb067a62ed15e46a985632c7c3f59a71cd436c6b905aed4e91a6a788873f6f4bf24f60c543d4517ad90e993aeca07bba150e27f59777ed30f090b43172e8b117371e0e2aa74132d731f44960cbc1997509abde813c3cb71966c0ffd14ce77d5fcea12f5fa82f7f791e9eda1a8d9a2a9c7aeb77f332bcb88661ad78b359061e9e764b26e0ddd39c92e4799e98fdee741e9c9ef257e7a15da39c4fbbddc8b9e5e1ec577ed0b9790eebc2e9cd8a2459653a9fb1eb7b1edee6d3e902b8ee60063f5057fe0ff0d02de6e6369168730a3cdceddbcaa285c1525fe75dc19e4d348187f3d167aa903b6b1eda15364ce0b957a1fbe23cbc0e5dda19e882936292f62938a7080718fc708db28fd9c3c897d9f561f9c8c49e797838dcef8743d979a5f3afcf439a977b98430732937c332f3316b79429b64b99a4ced5fb7999bf9b97d9d3ddafcf43d4103fce33ea71f377eb43cecdeeb46b25d93c32594651abdfac0f71a67ec743be3e2ffbfa3cc47e6a60b57260ec7d3be42c871976eeed78d8c06857bcdfa7bc581fae6d36fe033ca486743f53fb431e9edbda634860aa3630c7ce973aedea1b70734e8863bb835972a562351e220fdf9c77f3fe2bf370375fec3e85c11afb74caa941ae967e6853014c9c77f6e0669ecfc8f337ebc3a88dbf371e72e0e1fc757938a257087b29f094aa52d627c3030d7abf606975b17f5edac4ce204f001ebaf3c318587d7dcb43ce47e732e2eb818b244d535a07c394ace03a554c9b748d44921e7f96a4fd38f66942d333536f33310dbf60532df0cfb70e0f6036f7f57c3daca7ce6f1d8d5a034d86ce50e4622ff28d925ecbfdbe5d764040404040404040404040404040404040c08fc09f3ebd497873f9ce85d5fb72be7b50f5de39d5abfabe49de77abe12f0a5dc9b53fe4000daad5a88681a52ab848d04d9184df498e4774702f49d0ddaf82df097a0c923924e582bb7be8762746350e3c0d159889ee29f89d284a82346dab8124d2aec624856e54748e4541129290a0131a010560762c0aa9e20faa38c702e8d0952846f75659eeaa795005d9938e8e26f139d25a4642293b151593fb2d5b0de75414eaf664784fe1c966f6f34c646db4db1d913613cdbb13baa9d2f7dd2e6af17d475452251568c834a34aabaacef3b952f0e6cd79deed50774ba35a4d836f7238efce0785a2cf6837efc8b7f31e8b42bda4124b47addf042ea028c9540b451558fa78861290750aeb1b99e0195673d0281c44b14b8abeb92f3bc88e34dfa1e68bf5edbc9bad6fe70364bfc7023d4e4309e4060ca942afd2591b615128093cdba23883b739a3be8f807bbb1bead1a6540dff25dfce8225699776c83095c215392debf02c1efd1ee570d1c55cd0b17ca7e1a3cac49ed3c33d78ac430f54714a67f6e8c7cc1ef473ae3a920140a3ebe08a64cc5494ab264d357ac9b3d9814f782f4567671233a1f7658149097995866a52ec01c257c3f0b92e83ec8aa8a246875728eacaf125b06d4b12286051494745b96a147ed094a8823e44cfa12b354d5461f69f972fbc7790bc1cbeaf1ce4bd73d6b75cbcf077f7dee3fe8ba3fe25e9fd05e3cb80b5d42c5e0ccaefcb7ce51077e5147049782b65581cf9058fba01010101010101ff797017a3076dbc325c554b952985cb6441665ce409d4da73b9245cac323209c385166527afac684a966181740f93283b9984e22d4575d13d5f3ab9887545f97bb86acb7c3592a8c26de1625206f7b26c957d5d8da7ca518ccf655071862f412fc87dcdd25793f96a1e54fdbce51aec72904d75314d2d6edc92aa9a0e093af66ca7692ac8d8e9304d15ee87f20a52c83bf0504c4515d33dc88e9a7231642f7ad87c605145459b3ac87e4027c4022eaa8a948a0b5f1466c7a031bc87a489a2c7e005aa28a912ee0d68d4574fc5d4a2d3e51c6e1d7013c6e1b96ac42d8d2b8ab9a2f0fb035553811b3e2caac29ad55854c500df43d4504245716be06d0a8a4d334252831c4ba19a294137c6ed5414bfb2d7eb705f6eca716c88da711cdb047641b287ab1179d8b570414ead9b712cb10a9b5de2c36d39a2ea1b93780f98c224dc2b47dc304151654bdeb71bcc8edae81d5c8cb897b345a1eeba19b128b493827b257ec66c8002d007b63070d1e04e2cc77bf8a9785f96e5802e873bb837e2a7d248688aed106b2ea5b0458d58b31a882a780bac66c446aae15e4ba18206c85e932d51494509fb823f6f03488e66858da2e61ccbda305f2b2d7ef7cb878c61cc055d5bb23f52b88f0ee7935c0802ca257c516c8921f7788e3d572356d5ac6b5ea2bd89a724bed0ce161a3ce9627d8f8925eecd33a182adabf949263eed87dffc7e9bf3ff24b03726276f333d0e0af99bbfbf5bea8b7a5e6cc9df3fb6da10bf282bec8c030202020202020202020202020202020202020202feb3e0cf07eb3feec1fa57c3247e00be133979894dc81ec1826d9a7dd14dbc1a43f9f2e94ff9839c79af78f8c7201ee13ddf82e4503e3cb497622db2b88d5cc5bf619a10e20799c885fe7965e68f012a0bbcee30ce5f841341110fad30cfc546ddc64f3c4fc6b5b764c1f2fec758c3b3f22f394b11497f9c8c7aed3e23ef3ac598ee1036874c3aab96df911afbc7d3c3eb09fdd3b89182fc6ecda4f3eca2d0da70bb6e5c793c45ff323f08acec259e49fcd558dbdf2398b3646fdabea85ede358712f527ccb52c4bf4212d58dc1425aa3324f7b26ad516425259e7a896911c14131369d177e88f147556fae3b116acee874aaaf676eb181f4d7f2b45739b687c8e9b548c7579ab20ff70bb95523658521527657a2c92ee88aa231f4d32caf7eb920d5d3ebcba9ded52a9aa86d5adc020d0a895622e4aa617955575acca7e9b69501e5007a7ac587d272d6fe22167b26ab5bef7cc9c9a44ec7b955f0d6b8f9d3e1e52bd1ff003cbd6f0e296665325879bcada514e067d378b2e1ae5308faabeeb0de64174159d8ce9eb462e5065696cd858ea2e27e575a0127ad3be4bc855ed6d1befdac843c1b2a229c82bbde7a1dea167b3bd32f78c25d75c657dc9da92b1b68056d75243451e427f49f67ab8eb98ab9878b817dd55b3e4a8597edbc02f3d4eb0e670abd297dd9233958ef022edadad6e35590d4dd844a63ab92bfcc01f3f0de23c453c44075cb5b53fe828903b4f6ec04af878a6428f6730ba546ddc42fb2b817ff5c2c3a94657e0896a0f6d2da5e7e15eb1a4d8888734bfaab63dbc1c0f19d7755be5aceb044b668a774f3cac7a1cad5872531fdd992944b9e3613fb7a41ee4c643863ce49e877bf4d3ac780b1c6b171e4acfc363c2649eee9b858747e0e161ab7608b384604da7e66f99e7c87a523445de50f34f4d68f03599648fedf0186f3140b3f880bef4baa386a178698730e99e60c83195441eea13f4eb2461ef78c88a51b2eeaed19d5972d5d04ef9707de2e1c793ccb2aa974da74faf789897d05993a332f0f504fa4466621c819197243f42525d7cf8f88c8ba6a1bf5475a7af1dd3736ed73663dfc30c9b1eeae19eb07a82463ac0354cccd560793854d4972bc3abfb50ef6b361cebfa5eb3f4540fd54d76d0848987974dfa320cc0edd41ec657df479dfa3c39f4acdd27f978c818f0323975f95808d15479774f3f7e6d03c3455d1b53773939d044054faec93b262c4bba1a83ca905d265cd7d0a63a9c66a0d5421a0ea4690e7db9abd398eea71468a6d3a9d490a260cc57e6c3471f0b0dabc04ebeda6cf2ae2cdb5e33d550601b5101d3d2aac56d84eedbd6c41b50b35a36d3be482c84b9fd3a0d994e7f50d0ded3fee376e33f91e357b1dca7bfdc829d7e6f742cd1e5afcb26cd6dd41f95a8e4cdb9225362d2c846556efef1fb14b1ec2b499b14f7f1b45ba724a7506abd1772a79f6aff49b7b7e7e250d3a0cab9cf4c25315fdc468e0b5d552fee7862dda104b7a69156f1d61d477c34317420e4dedd5d0aef6c99747f2d319e16b1ba6def9399b67b9e0ea4c80cd41523d8ebb395dfa71abfce4b76f8cfe90ebc68b5b69c36f0adce6d0202020202020202be12488063974ec25ff9a597b5aa7af23de2fe58848ef6192f925c168f7621c6d9066b6cb771f252bbb777c5daa9c892c5bfc336c248f4aaa4a5e0ce200ffecb724b9fb3a6c3ffe5635ded17d968ea663ae6ece3a4b0cb5bb15ea52f12de0fa5179994a39b1af1e24c1a2ad41a2ace72845df0b33c57b87982b4986fc2449e4ee5d42bda2bdb13cee42696b6c6bd9d205bc4df8c79f6220fb93381b4af4746865ec025d6b6811f06a02d1bdae3bd7a1d773433f7928ef230e42ef50c59172546b5caabb66ab24d369fc9c5a8649f4a4d9b7312a844eed5a5d6d0bcb22c865f700da92a933a63285826034d1400c898c4cc426b89f7d1e316979a29d8042abdc1d60abe4c7ad063dadf5eca02ea71aae0465d390b71c1d29356661fc76daff2a9de84872a013e95437c499988e8782d89181d8ae487dbf1903373286eacdbdf6ead66e3d45e6e697923476178c22edbb6b85d0dd387dbed98b26a84ef7d52dd6538ce437d3b959bf49cba157d275f1e6373cd471412f4a350197d418907c7f298e428db30fb4d6452c88bfc9eb06ed265437f210fb1cd1550797fe0e90e1ae93e650cfa467fd4acbae56caca88b4f83682f8aa5375503e1dd20a004a6af2a990dc96792f3069a10486e5399f85b6d9c78d8dea6c335c5c125a3e3b9aab6b2800d64528c4e0375514b2687e92e699a753cccaf3954ba93e941b1e46ad26edccbbe94ac6fd19e9fbe27f270e02894ea8e7502afe4790825e0d97b7ec9363836862a86e3b1ea5e764b92f20281063eed0eade5519ef290491dd547d383105030daef43c3696896b53ce44eb037cb74ca58776dfabe1f047411d6974062418333f2d009a5baf158740f1e0a96ef5118b0493b847f8da92fafba25b73cb42a361754e07032292f1bfd709914a1bb258c1c07f6576de7e588d675b61d9ea5a9329878723a6b6d466e7938d1c9f0d20e739c94eb83421ee68e87c76d7808935997b3bee3a797c21a6efb32f99a44a91a93257c65754b48c868ee9b9c68e647a3b4566ca88439924cb18b48128a13991a2b6ea01daa7badf46018b543eccb458cb30ef0b03ce6aa3e6443af33e8f4f51d1e211e72e2e175031e32d9147963d2cb2bd90857aa2d94628749abfaa658a75907f3727d877979d479615e3cf3fbe8f665db56461fa03556061b5b7280b555d5b3bc1dcb52b3b4cca0635725ca78ea41b01ada5adac6385e974694655fc2d094b4e558a54c57ed680a582bc1203b6998ad3f7cf8c1a5a81aaa7d51bd14d189b13ddccb3ed36dd54e3062dea1239ba245672839be54b6c939764c2b7aad34f0047f701e6b4aa15bd0dc324d21b5c8912aca7b70d5072b46e4a156b23559ee3606caee798496712e985d547efc5282d6ffba34d9cb7999dbb711e8e5567915499d53e618f6631b49277e0b71bb4deff82ed0dbea26f3ebdf816ccc5f10f2f06db4b7fe0ee8b0e16f54fb85a4737feb5dbe611410101010f03b78abc6f3c3c7a67f7944fa3f43f11b3184934f6c250b78b693123f3c5c6f71d0ff8310527cc34ecaaa0d89c5548af9e377ebe26f2b1b9f37e4fdb04b402ee4df5aa6a172dceb1d87955608aff2b788cfd8b34ae0474375eb13613427fa41d6c4e3df0a2aadbbb2ce5fabc1c924ed70dbaabb34718d4e51d80821728c23b1090fbb36b2ac70666dac3b5b3b299bc8dffe5c2044e299cf57053ce5d9e6abeb6a3c4cf7fad52d3edefb72df315db4fdded05ba8aa1d0e0313e96128a78f57106778bc96de8187790d8dcf240f3b29a83d197a3c41ec122344dad7b0853749d777aceb0d314cc297c6941455a451835b62dc0f6d84367a302aab6bbd811e2c8a132b397469f1eaae3a764cb6236b2ac9f2131a89b0fa2ee19d9442f38771dce4ab4ab29312c79aa5bb78b19342c9cfb1aeaf29ab6fd320c683692e096b8b6638f5657d3264084776528d39353cbdd6e65a5bdb8aa3e84e93298ab62eda0d4491683d76cc9aee1be321aae8960d43091bfe60a8790fc4de533a96dfd24e4a327d3407f8844b3b646ad7a114323650377e51d694ac9d186bef70d9e2b417936d05d9498d138eabb272f6293bd4c6cf99be6cd2757836def6837eb92c104cf7fb2a6657943e17d63e055f6f91a77cbc80874e0dac8d8fd9f556bdc1d93ce61767273549664e7d3f4cd3da4e0acfe3da9415d64e2adfb775c262df0e8fce4eeab8919d14efa6c3fea5cd2387b1a49f3a7e4507d88579b69342f5838f3f14c685536c799846bdd5ed58d9492db66637b406ce5fd94919e221d36973334f7652dbf1107ff66932bf6207ad75cd3da3be7c4b2956154c2dfc60d08010fbf2267652923cafeb1bf6654e7d998853673446b967c8c31c9344fcc24e6a82d690ef73b443e96e0afbb2b93ceca436e0a1b5f9654d275ecaa41234334bf6aaead10e9772f415ca1a13143ea2c1d2160425c97ec8b584aed1452424e9e60e63a989a64d92bbb1d516659e5f6a6b2755adeda4a6639757a5acaa5c8f2dafafba9bae82eca4eedbd949994b3ad6e5fee5dd4b9574b781e557931425e36dc7f29b49e0c38be19ea4386b7f34419ca448656bba115a524f22a97c6c01358bebb64d61b958030fd580d7bc46133e686b694dec3709affaba6d349370bf5798adef0699c3a51ee05fa337509dc3e170bc1d86d726f148a9013e75230eded05ed186af1d3298a04d5b765bacb1172537d22394cecac75b9bd8bda7dd3e91d58977602fed3302c743520cb22a6dcca931cac5abfd5667a575f7dacd8a537c14f6c88194fec4629cb2897d8a5f1e58ed43e17e7197f46427b518036116e9fe10682745c5587545efbf9f3d8adbc64e8ac592bddcd85b0d54179b003f2e7eee87eee926670ef65b0affa19c322c5b3550aff8ea0e3e844fb48b8cba7384dbf989a3d289741a9e8f0ff2c17868edbebae59a1cf7fdc631d053be013d4be5be27facdf19b738f55aef74787fcf9c215c01e3a9f1b90fb7f6ef31519fe81e522202020202020e00be39b0b954f8aff47dffbfbfcf16b9b977bb3eafcf19d85e0f15f90ebd1da5e2535c5167f8f958d961751dafd89700648db6c9cb2742dd7135cfda85c4fd63f1f9ceef7c1d15355b5bfbf7655c3edee0ef9259df8945b7b388c8228365276caab68cd0ac1f0e4ea47c01f72bd3f086c6066524d5a1f5f77ccbced295ce5742833db5493e2502a26b2e150984ddaa19c0cfa3fd4c847741ab3f83f144ca72879d6b9ee38cbd30e257d4aa739c37f08e461a2f334e724c3d5d6cb88ea984a649748de75dfb4c3f975100f0b3174ecb5babcb91fd1d6acbb76aa2c68cf97cc9d6aee428e13dad47d303996262950aea72e35eb767a251be5e65896b78ed5976214c36dacf6399b8ab2dd99aab5366978067bd8b7e57560dd5c96732a51ba929e4477aaca7d35c2bf2de47a285fbe1f6af5722fce815f685b7118a079a0f741cec9df97b7ad386ca3726a7d4826fb0e8d613c0f39cfaef0cdea4a9a0bb4bcab261ba8b610acda4b3696f420caf52ac9d2bd2e2768a4a995eb1d453727781abe89cf34865ccccc7dffda4c02aa233ba92b5a51ed5126656dcd0a93ec35471b9f8fa78731efbbafbe8e7464e97d4892890fc9f5607099fbbe9f26e9e57a03c9f5c80fa795eb2597d1e8875ccffb4cdb8287b6c0dea4f3abce0c4310d9f85c31b2ac93eba1bac396723deedaa1201b45b196eb1db5407f7c24d7bba4804eb4deef9c938d3ab9de2561babecfdd1f91eb61bce204cff8894defdec8d93c5e3b271b75b666d540f2e5eef6e1f2659ae9ad5c4fddcc3121ab7327d7cb4ed697690d3c4c30297ec8f588879cfa720f33e13d57e40355e17db36a87c7fce3fdc1c267ae2fc96886cbcb37a2be2cacfbc8b923e963cd787cecc8f636ddc2f696c749771c122da79ea5b78c1ae49c265d978bb64c92a926b91ebf8f4972306bb91e7772bd439ab4ad2c216f53f1e19874d5456ceaff103f9ea96efbf2f538417d1946a622a3f7c915333006a6974cc1bbc46dbfc14281e9b26cdb324dca8c8926c5de9c5425a419a687713440c90069790fd78a0d38cdd45eae27878e4f8d19fb9c224b379ae9a6acd351e6a38227e0cf527ff878684513599fbe163388b2bccce5906555d1eea13f1f0dcb9aa2c505797768a7760b47c9e86a002025ce5732a62d12a5c4740bbb3a2df26486d1e77173075d9a59e54d1ea35c8f93a771c88bbf642639ac6ce1391163491b79f160e8defce5d7215bb324972ccb71b1caa11da2d919ca68b9caf3ec131e07d0bc1cf05b107dfa954c96fe0ac4460149fe5b08cd3020e0dfc7162a403f5cf1b75629eee8fadf90702c8a377f1ca451f6da6a8cb48298752f2dbca690550e721e9f3f1533b957aefa0b359342df2bb560e1f594487b6f258692dcead47d2e1ea21ae2760a86df0757f137c611c1b52237e83a77c1a3b8804be4aaca75bc150f35ee8d16452dd84725ae0bf8dd295fa9d3b977b077cc432ec4f9e39b931c88fefb7890265cd2ef5bf35a16109b4b8bba9be3a13a24d6695ad1eb981900002000494441547daf289e54554de326f1a49830f7b618c9ffa1b00155928b6df5e4c3d0b93324853fc1bd3a9c55e56469e259ffd09eb32aa8923d7bc4fc309053b7bd699b43f9f2b669263c3f34f71c1df62175e925cfcc31ceaa5ee9aadec4f83639a53247ff875038fa3b44c75fccf2c23a84c95496e3c61d8d6a541c4317915ad930815a710d29e83a11fa4e8c5e8e9890e8ff50686d8bdbe0fc106372f55dd2bc94a72841675f473c7e3d75282fc283e3ec98a0dfa7ad7cf729e4db38c417c36294352d3ed35877dceff71dab8f873d4b8ff7e3a459796ff757d3ee23ebffb068645515fb53cd34e4851226681c79a4bb68d8cfe3709fab8f773b82845df3f15bfad862254f39e0416cf6077ca691772af27f98c317f37ee750568f9699c35da4a74e68e0250aa5fabd662d7cd0a6a27e3fd5a23c66deff61520bef336d4e5972362cd97db8bf2ffc74d2ec6f6dfa5266c8dd19acb535ab1f7652cd56f214043adcbcd7c092fa70a0d58a6b876cf17f5828e8f0b549cba3ec4bf1ceff210aa5f2e436a4c2fa3fcc4f2a3933f23ba7b7f03b47d2d1b6bdbf8ec945ed905b79cafd21937ab4c30f27889150fe9a522c2ef47fc8977688c66670bd73fe0ffb61180cefd7befb2c0f9db159d2dca0adb6fdf6fe0f2576e2bed32f637271e7bb6f8fe79a6714148912c7c35b47f6871b8d87d01349eaa1a61a1aded297d9a31da2ff4314e8009f5ff0108552b704d7bbe6aec60627a9c5ffa1dec075a86471d5886ff19065b29c247cf44b928d07c6538d36edd970e7b26cb3fc60365970e537a3d1475bdff2f4a8682e89c8779b6c1badcb9291ffc343aff3d1b066f17fe879581e133d14f100794d91d5479db7579853c4667d9986ef662aa7f6d57828dae970c065e0305518c313c5a3a6982a8c27554ec5106fe38be0de96e8ffb0806a5a8342faa4b0fe0f7553968d66e998719e9725da94d5352caca1e575a5c4add46844390e659bb07c2cc7b2c3d8818da95472071e568ae9690b7361f8eee650a62f6758a10912175612372d38f368bb3f11b474db82a0585baf9b0a3d992bf27fa86c4442f4890d74c4e4341bb2c1a0994143cd50cca368cfaa62096cd719edad88dc0c765a0a97889005f682eac34d5d1168f698bfdeaabbcd92774021c88d0bcde63ef7261fd5ee479855d1a3030f5b9135d892922f71a46c84729b89db4d0ddad2e3a6c5f24af8a26cf4291b5c6a0b8a69dbf9daa7aed5d674b6702e1af87204b1d1f6dedbb271fbc2f6a488b9389afea8c3b9aef7219a17af234c0ea9fff8cbc1883798dcd04cca56fe8df7f13b7c1f139c7e8825613b8a7e0ddf8a0a1ff0e3f86ce771ff22fea2cfaf2f836f4a3502020202fe3d78f1a1b7e177abd047e0d3a70051ce33a30d80a4627f8bb9a5ec3ae712bfeb83e925ef1db160ff7759e55c02d82d8bcb2cb6f145ad8d5ef883fcc208d48ead3694b07370615d85ac581393cea758f99c10ceed88758ab14dec60ac479bb6e9bebb24480dc019806570055b7e9918936f12938ba75594dadd1bb3eb3d345359048ff6f389c74ece3d457f2f0ee75d0c6bfef8e76f7cfcde0aeaca8b616ad1a5e1b77319539b3a22adf7ac6d4d557261eea63fbc0ee4f59b9065877652492319ef3bf6b04fe1221d1b546b4fbb5af0144f709849ba32655d691537a549789da4250628ef46b8210d7ae4a9456ef4582bd5f45bc4e4e2e82a4bf45df7d2ffe11a75450c437f7dfa962874f3d894db2cc5ac8dcfa16166a6d6e86c2b44734ccdc5b0fa3419514edd70ea58bb1fccae1ccdc92cf629973ebd953c3da5e96db0b61537d1cd535aedabb42d3e5e9c4b91ca8eba219f30dfce067d2699ad3b333cc74679cad6fe0f6188d993cf34bef27f9858ff874785622686e7d76813e0fc1f32eb33ad689cff43c1b264b1f199354baef966363e717fdb8fc9776707c1d0680b99883e2451c842f2948de249110f81b27437d859ccf130f7befbd04e6a5796e3a158fb3f64ec6127754cf2c3040341f6d6ffe136b6664064524df7e6bb3918f20c6737e42107aabd0fc90fa785793b29ce4c3472e7bbefbdffc3639e24b95efbeee3d6972906fd43af78aa1b6eb5a8fe040f699aead3fcb53cc5671243630dbe45595bd9e866fe0fd1c199b77924d3ac879dd4ec7c9992ff431bb5b15af1906ccdc84e2ad9e73a26ff8728a032b7275bb30fe7a164f16858dfc5f3770d88d0852e23dd307323c9a3de2768e0f5f167755c641d4c065daef635eb2245f3f26cba344d785f75dddef93facdaaebb593ba9cad949c13a17eda4f66957347c2cbaa41db9b92429fa3fbc38ff87d77c837919869da36987b2f8deda063a07cd3a6dcad4d47430908bfa909afd2b1bbfdfa6478f4ddf8f6952931a17f93fec1b8061b169c64eb0ce60a029d3341dc5b985d52b34393b2f93ff43d3d41a2ec7b1ce6035dbd4492d345cea1add21ea8fe721aede93665f99ef87d7523559610fc034d53440101369d3271fbfc6f62ed9dcf93913ebbffd82997b676a6ef7b4def791dda89702b95cfc29cf26fb1406ebd2efeb317b1d58e125549ebecf77de69fd1ffe69f08d7c02fe1d7093fc8d97f9522288bf738ecdb7d887ff3dfcb5f6f08578181010f0cf639393fe1facfa9b7159bc14626d09628f01f8f2eb33e1ef4d8edf761fe7243b688fe084114e91809c65f34fb7c67e1dd0e90fc0ea9cbd84b07a69c2e92b917cc35e2e41ce3621297b3edb15d9220d5bb06cfddc15fd90deef1c7fbdc6d950eb2b4bf4b7be60dc25fc4d4c2eb8c4668931b9b6e9cb22ad126f036a55da5b459fd20b3a85ff6f91f239f9693c74cc4bff7c26bf57167eebfdd1e46291326d6ff7e6b5df17ddcfe86e4e1555b34f4972a0daaa812d294fef63bb4d4c2e3116d7d4eb1732f2f785818f98f46266fa69b3aeabe76cd5f85cd711efe47a1b30114fe76ec968aac3abb32f3ed4645b314c3127ef50187d2a66dd55a9c2083936db34c38ce47a73ced0d3dce31c5be8ea742d15ab8bf220f3c369ae059bfa72deab7246f10ae9c0f262ac4e7b8c8274bade3585bfea2e7177afaf9734bd5e8dfc703d583ab4415bb3f8b5df39e733ed826df08a3f489eb2754c2ee4a1800f27fa8aad7ca6c962945935327335797c344ced0d6bf779b6bf27b2e8ed3976caa67d022d396eee9cf7c32293dad5d2c0bff4f8f1e78734da5c4c997ec3a3095ffcce91ad19faee233b29eb336d233b29270b906d5b915cd9f35063aca1e4a8cc3d466b8f5cf7ad684746b1cd86259e5481b1906e797d4b148b632f4fb96a78d2caf53e1c382277edf1debf16a7ac79b8c4e4124b5cb39bda649e7332a9243276d9ecfc1f3ec9a4766dd54e638cf214e7ffd0f1906452b744d6f77b993d7cf7e94526f5d1b0d1dbe371685fc64202facbc577dfd1fb90c426e97d486ec64340792c325a8e389994bee4d86b14f230dd0b2961e2781fd7ccc946d13677aae21772bd0f07ccfe3a634d179fbee7ff10656519461563a229e965343a63dc202617562ad52105f698433cb65e462fe358c6372362e8bfe8ff505d53818a20d5130f49aed72a6e0ecaa0e0e50625886cbcf025aed9163cc4b9ac557d9a9c5ec686cbf3ea90e73cbf987c2a196f3a0697495b713114498aaee83e9a1cb4c06aaf8732cd6100d1570a40d9ed2a181b0d4ba7a69c12f8741889f440d7ebb866d6a76e55f4fd1df2dec70646f0ee3636e351aefd1f7e3cc99ce555752f70c9f7feb62831a058af585ab67d0c2b375c73408246f5afb64cbfe1aeeeb728e271d7a1c7489da0b56d8e6be32ca18084b0b8e9705daf2191cbbcebe0b3e7404a8ea66f392d757305e361dee540588e210c315bae12a11209a5481127df97bdfd12c5b87c515d35e42ff7cc1c7a908c71dc91196a0fc5b8778e63bb0544d7839b2c141e4a8ec26d57ec3de10479abbda6e0ceb183dbc0c0250dd842485f9e7fd2ab587ebcba9f951ec2d77da9b1c01ff64582825b31bf7d12822dee5a3e961ebe54e8755cd7924feef76d9c7b06bbdd9c37e6a2a0b2ccf259584187df35fa73a80f07777e375eb2832f7b4cee8e6e980d95e5533fd7b90d2335ce4f47d3bf864f77a6f92f42047bbddfc5df912f070404040404040404fc01bc7302b2ec41f8fb3c4f967b6f1789af76c97c9591af1e646bd1a1f81615cf35bc278c2f19d62bfe7754b8c23f7e5f10a3632a45e75b095ce1094c9c2479a2f11441c3451e53ae2449344a8d35de24dfa790624fcb145c2578222a72cc6f93723468c11d35150185292a02abc4a444a25947b24aca13cc25a8544ca222d0524152a98292e00afd69092c8b68cd304e85c603199d3bc224d5bd908f84b922d02a169fff681ee623a08372e37a1ccb01ed8874398e2dd9d59a722c49f8a39b0692f00b1abc497495cd58d678d6d341d288ef1d0f63530e788293405289d60db1c152159e4e8e2e89d5f8247abcc58aca14db463a36e38861d562cc454ade542aaa0f2824acc62f99c0832d1e14f31a6ef619918f49c8164c2a314961f106cf9b5220bf41c2548f4520a7bb36f9a6a2c92f43c40072a624e33823910d266564ac2cf1e692843ebe28c96a93c474d33e18c7c22565128fbf281725e195241d099fc4307b469ae919dec4245b049e6a51a90b618fa40761c88a27c2628aec4855b2858a27c22cf9f68de49752440e080808080808080808080808080808080808f83efea205eb97c1977233f2b7f04958282d385de111be05fe8942b3b5a33c97f2f453f87421ad050997fc51e4c610ca5b9db8d80f4880c0bad74e60b9dcc6ceec811e2540e5a0643a8e4dc215fc8d921d26c726675c35e9126641978d624c0fe898b32bd12d9519c72167aca963c6bb52e5a5914c3579ed8adc54bd0ead93fa7ddb912454d528811269997269cab21c896a359403b9d342b7a29b1103f5d77d154d83514d34f5fb6b2aebbe88cadeb02e8ad08ce7dc389faf82d551d4a10515a657d141cbfba96daefb849dd0ede68091e14e09cbe7cef46d74186ab5e9800f049d0eed810c7ef4e10aa489f1741eb84c9ba6897aa4ba3935b79275bbb1b8bfb6d7fd1090a17e1a19063f7a21e4edaeb930114a11cb7d3329a667cf43ce6e1545d1bbdd2aa12efb83aaa354f07c6ed96de1e1b54063177261c7360e490afd224ad3bc474b983c35bb8ec5757e1bc80ec05c88b3979a0d3b35162a2773baad08c1923be4e188fefb8093d037ea08fa051a19cd09d3a7def190255167228c1c575ff3ee321eb2fb41426b68a2f806cc16c8c35bbd4bf4051aabe5e1b6ed90b3ebf5900aeb8520dda1005b5f06ac348e6aacb9dba5cc4479318a6cae37d61f5f788851b952c743a81cbeaa6b87b40e1b2f3a05aaf26bb74fc7aa3e64fb02c3df0e8e8735f0f09297f7dcf3906daa6e8c14e5e5259a34397f451e0ae221c68fbb90eb01e4611a25c8c3d31fe1e1801d98f530bc100fe3313a1ce67d4c3c24bb10b59fa743d4220f87ea96d6f7ac3a6a8cea7991d097391fcebabbe63a6a6e0f1e6e096062266a3337e4e60479c88987d81a4752bf494e069b42554ab5ab3789cdf400f130394f30d19e7164431eeaeb98764da4a12f5b8a59771ebaaebd64f9a9ebe6281bee0a8750f8d00d6be78ea9db21eeae095c9fff100f59724c52752b69d84dd1993253175436a10129ee747c69583fcbfe18272e4cea76401ec2973c475174cf99e5a1c1feacf795baced7d35c64d0d9cf12c3b2d6d00ef5b1e2034c75e32e8ace2d4c3c7b78149a1ff2509d22e2e1e6ee118125fbf972a5d923b91fcfc72aaf20e19e32f8f4407b3432739ee1d5f2db296ab34dfb32f4809ad4adb431685dc9790eab92d464a8fa636274bf5fa752c429f97ca83b556b9126bcc3e002b9311d92a65293e2d2d1409fee6a8d7efd3fdeffea5bba39cbd26ab0a4d7e8e25e13ad39eb6a587967e8b0b3ab3b412fb641e4ce67629e2913dcabf52d11c198356114de50d2063af3e69bfe973575e4cbd5e664237bd611cbfc96c5efa3bdafa5d5bdad68f11e54176b476bbd4861281c012b5737dc45a8582c1c6dcc0beec255f82c7f205c3d2d16bc5b25ee57a3cb3b78275f826fbcc85a68614e53d51bac3aff596c21c842f2855bdc59927aabd78709a98b04b231d9ce3478f9fc0f6b57eb246d315f15e1842c20202020202020e027f032d8f4bb05f20bf70d2fdddbbe5888adec6a168ba61f289ebd702ff73e1b7f41c58b37f261173efcf026b6b64a688e84c17ab0f8cc25a1551100ad45c8144a6348174ceac8e6c35a34c1da954ca7944b4af0f49bab25c95a344152b6184525646a0549d6200b93744e15593ba9c4ee7ec9fa8aaf09730659b070c7ec64146509436737982b21d9982d82eca4a0fc78952420bffa78496a5e4d55856742f130555389ef9d1755852ee4b880a4aac597ccdb6a2a6adc7ed49074273b29ccd5e31e2685a48a0e9d462c02737578137db1c5fd344d25ca3112c854d0595803f9272c42e3458def6df00a1d8d6640ce44a1a2a8d48ea1400c93f0bca083a482ceafa0a28a688552a7c2205390d6029314d65d23f9c613a6cb6a9a1a34d74b8bee1b9e137f0322cb3225b1edc47041ee6a3029c3037e4cca147d5bbc88294e984fe20ab39185922d02923025632e897cf5521168db6473910514a628da122a9fe44ac51355b8a0f315e909230ac934cb2709573726294ab284a915616c4d18bd514cb954bcd926fed510f6a2aae7b39177d73f55d8af3ff84384bdccc5d9a773911d101010101010101010101010101010101010101010f0e7b09c925b4d34e6a217f8bf3e2316a5c215a18f680f4fbe26b70a01b182d3dea3cba7f015c2eb656e5afdafc0aa8a5ac2840debe1e85d542319738a8736b8e2b64aa5efbe908b34c2adbef07615ff06d64accbe89f956c09644e1f53b1fbf362348a5c340626f96f6a9905cc86ee88d66b119506f7de836acfc1791f437a316dee5f5d04163835fb9fd2bb75ab8d20c9de44c9921d930cc2c99649dce877d84a273798bf69a315545c5748af26c9a15230394cf86f47cbf5c2f5ea1bd8b6ef7a864c9e9788f5296ccf00b0d7e98da9f0ed1c0f4f17ad8d65e8fc5b75b2af5704ad1aaa49d297c6689d100bbb8bdc468f5366c54f92f43f4175d76958d9d26585fe46a9ad910e5fa5e89f296675189dd2a8dd2b8bdca34eae243b19d21308528ecd1a36dae386f227d1925cbafb70e7553b2eadae5da9c3f1f0f87a86f99b7f3164a31753889762fe4b823e3c13bb28c0f51ccea48f757cd86ebc7075af37056a336f892de57ac810a85b9ed4e879a655534cff3ee93f5656c4e7a8a660a0ec8eccc9195d0e4a603f0308ae72a63d51dde423611031ee6e345b37aded4e628896a5c1fc41cdafea04d84fa4632a9612491d535edbafa93f565bb60496e07a294c217ebe26c989a0e127978ad149b0e9aac82d16e5d230f8739df724ed15185314dcb4e94e7eb7cdd1d786ed0deedb897d5671c0fd14a264d45a9afb67f08a6ee4754e91aaf595cdd647150ecd2c64222ff581fa97aa759797c1de8f5632842cbe53635309565bb2ac9f336cad2684abb3e1a8187ea13f250b0b89d4d65226b9aca591395699a4a13d566d730fc055d6b6855b21bd3630183559fcee5b66e31e2fa1445fb0e3e1b768e14a618738da25d1bab62f729d7365cc07878de8dd6e1b960f70870ce614a8c5a856363d44a48cc81745cab09b38b8afccf6c5a7d1d2f34713f1fb2f2ff66f98c647f2a882d02ebfea7e0cf6a027e1d7fc4b6372020e03f07eba3c1999d3377b2f9f6df232bb3518dff3c9d4f5853e065010f4a9fa8fe23cbc2c578df7a19602e803613ce3990f5ed40595f4631ff1bb02e2fdc99c3429c778081517b9c6c40ca3f41b28d5f84fca2984136e410861442cb1a34eec11486563382a13d4d6cc3126d4fd8f72032b462730e31d090c7da2ac5de89888cc920084330fd11524537b6ed9033551920cb541a8f352b831e81ca56719696b85f1aab6ac839336d5b0136dcc1ff0832539dc6ce9f7dc5755b353924c26b58c2f2b1c2506109256cdd10b178b3bb366d74d32a42d75e0d3a58ca4e111e747427dc2bd7270d7be94b5346c704f6f7ed30f4fddfe52137d1783f9c2c1178be550e973b1ba2728c4ae2ebf1d29f26a9f7f7e6546ede10e11ba9e880ecdaa72aeaa1b63e4a80ad738f0710c9657f4d587dd1dd6ec2665925acdf5909d55fedcba2b9a952f7f64850b076d6a2da496378361dd10810dd1dd6e70efd6d3567b53535dc9ec1527bd75195a66985edb0d8ebc3849e20d35b2beaabc6231d91a9380616f79029d9dac1eaffa1da4413cad06c5f66f9a5ac2f7840d7f517322435e70ef958d339f6f64eb39c2c40100fafb7dbed0a3c4cae3d1d607673979e3be261c2547b287ad147b7fdfed8c45b13f67da8fa7ebef4ca9d7de9c3beb8a430ed4dd73b71ac261ed6839505fc017ab01dc2d416030fcb5ce725399dab860a580b3c8c0f936b873235c742f667a3b4567fb12b5b6b783d0dcb196c75cdb3f20c139f4a0e37fcba4b3b947fa21d02e21dda4f271763c7c321cae32aba9e4ef31dfb324be709c6c373854a0f05f0d08e877f7338142c6b6a59aaa33d5f17e2be976c38a76383332285d104f69a7382e3611ffd91ef9d9e4f63b59e979308a9c38b1d34bf32bae4c0d9cb38ce738d8283a16ffabf797a070b6798828bd1c9a438f069ac2f47d547d5184da28496b7bff4bb4ae8fdbe99fb3f7280cd3b58fbc16a454db03ee466d269613d08a4799b0858648d306f9b12f224b03ec4d56155fc4df51158f0abbabab6c66d4a585c57b81c84c4aad1b082cd697da8c95d41bfad93ee0724454115b82b81fd08fe8f3b3ed8b6d00e056fe2ca3fb6ae09e20cfeffcbf3327071f4ee4990561f381623c34a780bf821488723fe7c3a6b9f085b7bd6fcf208f12a7e1fe20fb8d60c080808080808080808080808f8afe3db8e195f277d4f0de307937ecc3de40bfc7a953f5ec74fc03a2e451591586519054c144a912f53546e4047a4948b6e023017b90c4547a494440f3a5fa63e97b445e0691e5e093a9274b9c89769860fcac597295e41455c5045d6972915e1caf7be4c3d61ca2779f20511962de4c7befc37e44b253f5e69312f0029be6c73280e2df9a9bd1f8a3b99fc0c87a268f1c43fafe0261e70334cb23e75ef4571a0505d295c1528f4895bc8657deae24d3ca5cfb0d452a325d6044924401aa1083261d27071a0006e3526a14fddb880fc23e6c252278cdfa8464c229fba07208c7ceab64818d15a6045689dd4d852195358f7806a3706aec8164d23610d9ef2a487eee31ba2d400748d2b145e099fa4c845335ec925093ff7924b50122a36657885cd896bba092f4449f8daae543485f049cc1521b8abc82751a35b925ca9e879972ac26f648b4077d29e8ad893ff96b02549ae93a0d478a30333feded32cf50af6c67d2e7f6b09ce9d2f6ffefd07d9bb51887b8fdfcf55bea7822f5a7cab92c4dba7dee9f1bda0828c9949c38d0504040404040404040404040404040404040404040404040404040404040404040404040404040404047c0bdf50d87da3d5fa9d5cab9ffc55ee7fd584fe8d22ae0f3ae5ae97004ace1da5bdb659850b5225f812af8ab1f5a50f9a6593850d6fe5925ca5d6cfa57f708918f58fe18d0705e1fc76326c1582af3d75722e5d801de71453d8fb8e913e6096055b65a187b875fbb92880bbdcec9163158febdfc2f74c3b1e714c5e7656dbb028c526ad5edf71852d05f0e511f8a5f2dc33962dcf3f857dfbb7808e12d7b8e9047ea2bf25e0500f7faf7391310abc6c09d7a5352aa822f411d84182f573a52e513427967df13d8a2a32c961aa88a2836292cbaea07a4e0dba8ae4a2864be799084a2dfeb2e3bb5f0372e70c984fa7197e45479dcfa7c83994aca3f9e872a5d1e9b4ab6cc83b3646a7f99263b362e399425545a71d7917d5d36eb74f7c73caa37947163cf0f87c468b1f3546bbf91cc18fe84201b6962a3058c9b9fabb8e9e7e1182c525e2369f6e23fc1e54f2928787ddf5341ff38587a7dd2871645c7838a3bf5935edcec7c47752cedaf3ee80863ed97e178dd8b2dbe814ed9bbaae76f3ee8ab57c051ea25d1c005e7e37e19564af78088d75374da7d9d82905dbe17ca1e6b6e621931334b0dc0f7be806f23ac30080ae5d771705bf0db0b0d592f12cbdcc3b74b6fa257868bb9daccef364bbe04b1e9af3b94f77e736733c9cdbf3b98adff0309ea29958281673cefa3c5f33a6609cc03e1ddf77f3dd79f432a77967be060f1d8087bbc2b233399dbc934be35f302e7673ca6fbb53e2781875f71d450c5cf110e3a53d3ab285aa76bb9e8dc07d6438143d9377432e61c299cf65fc057948edf0743ad71d0118645f30b9edee9a35300773c7c3b48b669cb31f3c4cc6dd0cd389785e2ea5d7ddbebecd5732ee34f37c73110861acdcedeeeaabf210a6e8cbe58affe33442b7eb793762d8c3dd5d7a1ecae98c6b9d070fa7f9341792bd89a72bdadde97a3a9794dc435726efd764f30b1f417f3d1e32d70e4f3b5ceeec60c1832fc8b147ce3044f2db1c69e678c8ba2bf260e1e169b7db9de6e14d3384d5ce0ca55cc9f097353b9a4718b5c3fa250fffc535b6c3735f9e275aef943005100fbbdd7c4d74ae4b0a0ee978284b1aea161e9efa6637c3ccfdcc43e4d5c92dced9b0c3e511b3bbf406068af73cfc07f77a1ecf7df9cd9c02f3f3e974bb004ef34d7a1eb2fc02a35bb3f4652362985468d679007895030f69fb012bed79beba299fb369de4d341ede1cdfcaf3b9fdf7fb327fac6de80cc13592ecbe3bd99de0ee642763e4a1c0396668d6eb43580e9ef7cfde482d0f95bdd497f9dcd079065cc3c030e08a71bedaee2d0fbba8fcf7fbf2d3fad0f39013174c0d3005cc2d8c591e7226a10d1de6070f3164f2e93cb2b5f53c0c88be1d0adc5dcf3b373137304e4235e98e9689ccaea9ea7ff1e8cbe35d3b44781e565154d96ce969c668d8b62f535f9f4fabbd9e64065a6abf0ec76379486d13b7d3306246462b95c39a1ec656da1dce27a394828d0bed25ff5d267e87874cda5d06a6e4fb1983627b1e2ae8e42b1ea2878a7237a38fff57ed905688a7f37cbedcf7f02bc2202e827533f0f57838cef0dbfcd33e7561a71b1d7c5fde3d78783e626b3bdf72779edd46188bbb743c849e0830c8c319cf6da0b7aae339baaddcbd230f67df0e01295474c6a1f53a287c4088741fd9a45b2ad9bf7806eb21cbcba5b5e1bbf2e3f162e765612e37606c7bbb8cb1139ba4c75ba1597fb95a1eaaf676bca5b0fabe1e6fda3a16e920657ac84b38d7a7e34ef9bf6082eacafb713f193a86a57da136edfe7868d3bf1c44e8b7618fac97a37a77dafff8e94eac57c7d62b3f29fee87f79f271a4eda369fd080d7f3facdaef010522f67f2b1a61240da1be465213cb0b921be11f8b9cc00b53ac4089d1ea59ac5c85bb42e59baa385f0f993eeada3fce4366f9e42e5cdb6b000006ec49444154a46fc21d5d59499c782409f190cd312f52717cf63c7c0a1aca5d38b7a7aa1e0530c774ff29fed4db6e05eb1489af44458f7fbe89f0a7bffc29217f4af437fcd55baf4adf23202020202020202020202020202020202020202020202020202020202020202020e0e7c0ad128c5730b249a4f6b218623367722dadfe105ed807e14a7032d391c2eab6596d1a9fdd3f289c9292f0ba61361745dd5bacc6253d688bb04954237354b85c90cdeb4af9f2a5372c5f347f0411e655a616c2b860eed16d18b9d6cae59ede37490f2bfa4529863f05197b382278cec5f8fbb29e4291bd48624b8d3f40d8fbc2f88bf21f7a52ef18f07bd0f550d70906454c877a30a8c6abfbba1e3a6c0898542b976be8f04b7690bd4745553940528a61f292012e5199551a2c42a0763fde44d54e5baa42e54c28a2276d4f4c1a62285f61a929be11963aa06a6c8c49a4b59e60dd39c668a422509f2ec7ba73e422559479c2907c2cb51e309722c2b0e95111a8eba98c4b825273f6e1ed501b00940b3c34a6b63cace1aa431dcd0e938887f0db74d8d73bbc89b9445d9b3ac5a4048bd0c443b869b0e3e5988bd89ac2559ac16b6345b5e521e68224a6a822e2614d1541c7c4b2486b36a91d611912962e846112c7b22c0fe1373401a872213f46c288fc04932c0f910aa2959eff601e060404040404040404040404040404040404fcb7918f9a754d2ceb711ca418523a1a4e4b32344eeb8ca932c7e3c306fe1a9b71502ce9580d8f1848ed53a6fa31b5b70ccb0dded4b51e626d38eb151f6ac6ead1c44c18934146d94096661c6ba1068d87897507cfe2f96a0d4f19a6a0fe641c473c40ccc7246990b6cf6f56df4539ab772a3b44d12d96c7924edf07eb78613c2896a34f87b89a197ab1896e9a99814d09ab4bc6b27960fa1a8d8cf5117a1c492b666a96dff3834a5ac120ef61cfd83d2a1493d3a4206306ff52c87b907a9f4ff05daa9a95d131666c5fe4c796e99bbd3f29242c4d77093373f29739f4ff413c3ca9b888e05de47e244be3daf110de5e5b1e5e9187bb684f3cac80879031bbd64c5fd06bd500b75ad6b5c4c3435ea8bc14eca8597167ec801c9155a5760dcbce0dbacf8826a90e79d533d6220fefc0c3c394ef4ba68f70ff7c8e2ac7c313f0f0fa0ff290ff111eeac0c30fe7e17dd28187a11d7e82f130b4c3dfefcb5fa91d86befcd3f8243cfc5a734a581ffe343e493b0c734ae8cb9f81875fab2f87f1f0a7f149da61581f86befc1978f8b5e694301efe343e493b0cebc330a77c061e86be1ce69430a7fc263e493b0c734a98533e030fbf565f0e32a99f466887bf8fc0c3dfc727e161581f86f5616887bf894fc2c3d00ec31afb738c87a12f87befcf77918e694d00e3f030fc39c12d6d89fa11d061e8639e533f0f06bb5c3301efe343e493b0c7d39f4e5cfc0c3b03e0c670e9fa11d86be1ce694cfc0c3afd50ec3faf0a7f149dae1d79a97435ffe69ac7928433bfc25100fe7373c1c1e3ccc573c3cbfe1e1e9c1c3f3330f13c7c3fd8a87c03ff2cd728edef0706f7978743c443f2f2b1e9efe011e5e72668e595c5d2e8758a2cf196c8733baf4663dbc8b3e210fcb2330ea7abb1c34b2a905b643c6f80e3cbc5f07c66ab855b2ae64a96179954f2a6f04bb6b514d8c55d71678d896ead6b3ec063cba5d2eadd445dec283ad61cdf520199bdabc68982e7a965ea02ce0617249d323f070fff9792862ce64c6799c65c0b798fc2b3119db5ff017cfd0f7b9ccf01f64e198180b263023e486e7247aadc7a7458c3779cc25ddc6bc58243ec4212b64e4f08f8a615c722c5de2df5454cca934781428c1a00b2213022bca82eff5808080808080808080808080808080808080808080808080808080808080af08eeff7f971cf0a320067204e362e11cfe19f083e04f0d7151531181893f01cea5e052722632251f5d18d59202dee27dc3c2eecb854834eb72c67293aea2d2a954fe49e2fe0dac58c85d97a57ecc449a33953196267c1910a171eaa07ef60e42ebae53224973d4fdcbbb5443f7e590a681873a8b1393260a33e629b64a99071ebe833426e90c30ca748277789d70d6d55d92d639b441c743ce933a814ba6eaf86f53fcf9204dc2586704d326d335b4386d543cc008a80cf210fab2c6de2d3b4c1aa4328187ef200d3027e938f04c7529700bc6c1bcc6c1b1733ccc698dc3559e74431c78f8028e87d8ee54dae152b04b92773ce42ca9d324af030f5fc1f150200f939412725d733b2f3b1e32ece119f6e5c0c35758f350190dcb42a3b84904cb6bcb43181685021ec63026f68187af20d3c77888ebe91478061c83dfd000bb8471f8951921bb14fe0b7df925b842d30ed8c109b8104aeb4cc09808bf552c9982bd1efc135af058e75a2a2154581fbe80a0c319fc25e8a806afec1d9a8f85fde552c26ef935902f9c3fce6a7072e64baabf694fc2c2096240404040404040c0d7c5ff00d8f3205a949fe26a0000000049454e44ae426082',
    '2026-08-11 23:03:36.611'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: expenses
# ------------------------------------------------------------

INSERT INTO
  `expenses` (
    `id`,
    `company_id`,
    `document_id`,
    `vendor`,
    `description`,
    `amount`,
    `date`,
    `category`,
    `created_at`,
    `updated_at`,
    `flag_reason`,
    `is_flagged`
  )
VALUES
  (
    '1156055f-ea5f-49d7-b24e-47320e2e5521',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    '08ac55b9-5141-4af4-aac7-83c4ff03f6dd',
    'Unknown Vendor',
    NULL,
    0.00,
    '2026-08-11 00:00:00.000',
    'Other',
    '2026-08-11 22:54:48.398',
    '2026-08-11 22:54:48.398',
    NULL,
    0
  );
INSERT INTO
  `expenses` (
    `id`,
    `company_id`,
    `document_id`,
    `vendor`,
    `description`,
    `amount`,
    `date`,
    `category`,
    `created_at`,
    `updated_at`,
    `flag_reason`,
    `is_flagged`
  )
VALUES
  (
    '2fd32c7b-36ea-4423-bb9b-f102b54fc890',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    '5dd0cfd1-14aa-4829-9fc5-3c35722eb6f8',
    '1x Lorem ipsum s 3500',
    'Scanned receipt: images.png',
    117.00,
    '2026-08-11 00:00:00.000',
    'Other',
    '2026-08-11 23:03:54.627',
    '2026-08-11 23:03:54.627',
    'DUPLICATE: An expense with this exact vendor and amount was submitted within the last 48 hours.',
    1
  );
INSERT INTO
  `expenses` (
    `id`,
    `company_id`,
    `document_id`,
    `vendor`,
    `description`,
    `amount`,
    `date`,
    `category`,
    `created_at`,
    `updated_at`,
    `flag_reason`,
    `is_flagged`
  )
VALUES
  (
    'b4bb2479-45b8-4f02-91e2-2edab32f80fc',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    '08ac55b9-5141-4af4-aac7-83c4ff03f6dd',
    'skyrocket',
    NULL,
    0.00,
    '2026-08-11 00:00:00.000',
    'Other',
    '2026-08-11 22:55:18.415',
    '2026-08-11 22:55:18.415',
    NULL,
    0
  );
INSERT INTO
  `expenses` (
    `id`,
    `company_id`,
    `document_id`,
    `vendor`,
    `description`,
    `amount`,
    `date`,
    `category`,
    `created_at`,
    `updated_at`,
    `flag_reason`,
    `is_flagged`
  )
VALUES
  (
    'ce3d269a-646b-4c8c-a80b-48a29dcb60ca',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    '5dd0cfd1-14aa-4829-9fc5-3c35722eb6f8',
    '1x Lorem ipsum s 3500',
    'Scanned receipt: images.png',
    117.00,
    '2026-08-11 00:00:00.000',
    'Other',
    '2026-08-11 23:03:41.191',
    '2026-08-11 23:03:41.191',
    NULL,
    0
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: journal_entries
# ------------------------------------------------------------

INSERT INTO
  `journal_entries` (
    `id`,
    `company_id`,
    `date`,
    `description`,
    `reference`,
    `created_at`,
    `updated_at`,
    `reversal_id`,
    `status`,
    `template_id`
  )
VALUES
  (
    '38035a81-0dce-4d49-8337-4abaa5562944',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    '2026-08-11 00:00:00.000',
    'Receipt: 1x Lorem ipsum s 3500 - Other',
    NULL,
    '2026-08-11 23:03:56.222',
    '2026-08-11 23:03:56.222',
    NULL,
    'POSTED',
    NULL
  );
INSERT INTO
  `journal_entries` (
    `id`,
    `company_id`,
    `date`,
    `description`,
    `reference`,
    `created_at`,
    `updated_at`,
    `reversal_id`,
    `status`,
    `template_id`
  )
VALUES
  (
    'a0cd6711-2111-4f94-9f42-1641f3da2c19',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    '2026-08-07 00:00:00.000',
    'Migrated sales transaction',
    'txn-4ff87069-5776-45b4-b07c-db13682df900',
    '2026-08-07 12:41:12.434',
    '2026-08-07 12:41:12.434',
    NULL,
    'POSTED',
    NULL
  );
INSERT INTO
  `journal_entries` (
    `id`,
    `company_id`,
    `date`,
    `description`,
    `reference`,
    `created_at`,
    `updated_at`,
    `reversal_id`,
    `status`,
    `template_id`
  )
VALUES
  (
    'a16b1b94-bc75-4848-a5bc-08b81d35b7d9',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    '2026-08-15 00:00:00.000',
    'Quick books',
    NULL,
    '2026-08-15 15:03:04.834',
    '2026-08-15 15:03:04.834',
    NULL,
    'POSTED',
    NULL
  );
INSERT INTO
  `journal_entries` (
    `id`,
    `company_id`,
    `date`,
    `description`,
    `reference`,
    `created_at`,
    `updated_at`,
    `reversal_id`,
    `status`,
    `template_id`
  )
VALUES
  (
    'b34f5983-e413-4543-8e15-81e75dab2ea8',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    '2026-08-07 00:00:00.000',
    'Migrated asset_purchase transaction',
    'txn-41e733f0-ddea-42b7-b1b9-ed60223fbf20',
    '2026-08-07 12:41:10.846',
    '2026-08-07 12:41:10.846',
    NULL,
    'POSTED',
    NULL
  );
INSERT INTO
  `journal_entries` (
    `id`,
    `company_id`,
    `date`,
    `description`,
    `reference`,
    `created_at`,
    `updated_at`,
    `reversal_id`,
    `status`,
    `template_id`
  )
VALUES
  (
    'd2e2be34-e25d-47de-83a5-bf3d0024ed02',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    '2026-08-11 00:00:00.000',
    'Receipt: 1x Lorem ipsum s 3500 - Other',
    NULL,
    '2026-08-11 23:03:44.083',
    '2026-08-11 23:03:44.083',
    NULL,
    'POSTED',
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: journal_lines
# ------------------------------------------------------------

INSERT INTO
  `journal_lines` (
    `id`,
    `journal_entry_id`,
    `account_id`,
    `debit`,
    `credit`,
    `created_at`
  )
VALUES
  (
    '4151a83c-5cd0-4b29-9a1a-ee265c70341f',
    'a16b1b94-bc75-4848-a5bc-08b81d35b7d9',
    'bf0c88de-14fb-4895-b304-5264ea599214',
    0.00,
    10000.00,
    '2026-08-15 15:03:04.834'
  );
INSERT INTO
  `journal_lines` (
    `id`,
    `journal_entry_id`,
    `account_id`,
    `debit`,
    `credit`,
    `created_at`
  )
VALUES
  (
    '5e63e697-e865-4225-a122-fd362aee8790',
    'd2e2be34-e25d-47de-83a5-bf3d0024ed02',
    '52b25cc2-b941-4119-8c7f-f6f17ae84f31',
    117.00,
    0.00,
    '2026-08-11 23:03:44.083'
  );
INSERT INTO
  `journal_lines` (
    `id`,
    `journal_entry_id`,
    `account_id`,
    `debit`,
    `credit`,
    `created_at`
  )
VALUES
  (
    '6e5fea4f-df0d-4c21-8383-4a94b5123ece',
    'b34f5983-e413-4543-8e15-81e75dab2ea8',
    'c33224d1-16d5-45d5-9410-06f8fa00b99a',
    0.00,
    200.00,
    '2026-08-07 12:41:10.846'
  );
INSERT INTO
  `journal_lines` (
    `id`,
    `journal_entry_id`,
    `account_id`,
    `debit`,
    `credit`,
    `created_at`
  )
VALUES
  (
    '967e3e00-afa6-4742-afbe-9647a79e6025',
    'a16b1b94-bc75-4848-a5bc-08b81d35b7d9',
    '52b25cc2-b941-4119-8c7f-f6f17ae84f31',
    10000.00,
    0.00,
    '2026-08-15 15:03:04.834'
  );
INSERT INTO
  `journal_lines` (
    `id`,
    `journal_entry_id`,
    `account_id`,
    `debit`,
    `credit`,
    `created_at`
  )
VALUES
  (
    'b15ce16c-f21e-4554-950e-45e5b1eda4c1',
    'a0cd6711-2111-4f94-9f42-1641f3da2c19',
    'c33224d1-16d5-45d5-9410-06f8fa00b99a',
    100.00,
    0.00,
    '2026-08-07 12:41:12.434'
  );
INSERT INTO
  `journal_lines` (
    `id`,
    `journal_entry_id`,
    `account_id`,
    `debit`,
    `credit`,
    `created_at`
  )
VALUES
  (
    'b2493235-fde1-42a2-b504-6053954da594',
    'd2e2be34-e25d-47de-83a5-bf3d0024ed02',
    'c33224d1-16d5-45d5-9410-06f8fa00b99a',
    0.00,
    117.00,
    '2026-08-11 23:03:44.083'
  );
INSERT INTO
  `journal_lines` (
    `id`,
    `journal_entry_id`,
    `account_id`,
    `debit`,
    `credit`,
    `created_at`
  )
VALUES
  (
    'b34dc886-1898-42c3-9c05-5f744b6e0daa',
    'b34f5983-e413-4543-8e15-81e75dab2ea8',
    '52b25cc2-b941-4119-8c7f-f6f17ae84f31',
    200.00,
    0.00,
    '2026-08-07 12:41:10.846'
  );
INSERT INTO
  `journal_lines` (
    `id`,
    `journal_entry_id`,
    `account_id`,
    `debit`,
    `credit`,
    `created_at`
  )
VALUES
  (
    'bfbb79ad-c3a1-4f4b-8a28-908d343cd725',
    '38035a81-0dce-4d49-8337-4abaa5562944',
    '52b25cc2-b941-4119-8c7f-f6f17ae84f31',
    117.00,
    0.00,
    '2026-08-11 23:03:56.222'
  );
INSERT INTO
  `journal_lines` (
    `id`,
    `journal_entry_id`,
    `account_id`,
    `debit`,
    `credit`,
    `created_at`
  )
VALUES
  (
    'cb36efaa-7626-43f2-8f04-d6ae1b30208b',
    'a0cd6711-2111-4f94-9f42-1641f3da2c19',
    '9cfdf630-c9e3-4fc3-abc0-bd960fc35cfc',
    0.00,
    100.00,
    '2026-08-07 12:41:12.434'
  );
INSERT INTO
  `journal_lines` (
    `id`,
    `journal_entry_id`,
    `account_id`,
    `debit`,
    `credit`,
    `created_at`
  )
VALUES
  (
    'ff8da40c-7cc9-426e-9f3f-ccd3ac69a857',
    '38035a81-0dce-4d49-8337-4abaa5562944',
    'c33224d1-16d5-45d5-9410-06f8fa00b99a',
    0.00,
    117.00,
    '2026-08-11 23:03:56.222'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: journal_templates
# ------------------------------------------------------------

INSERT INTO
  `journal_templates` (
    `id`,
    `company_id`,
    `name`,
    `description`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '0f6bdae9-141c-4887-8e99-9dcafdbfb8a9',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'account template 1',
    NULL,
    '2026-08-07 13:05:22.755',
    '2026-08-07 13:05:22.755'
  );
INSERT INTO
  `journal_templates` (
    `id`,
    `company_id`,
    `name`,
    `description`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '2fae1b94-5759-42cf-b0fd-12b8af9111a5',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'test template',
    NULL,
    '2026-08-07 13:04:44.793',
    '2026-08-07 13:04:44.793'
  );
INSERT INTO
  `journal_templates` (
    `id`,
    `company_id`,
    `name`,
    `description`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'c35e14f1-daac-498e-bb1b-861c92cb8b26',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'ytd',
    NULL,
    '2026-08-07 13:17:47.746',
    '2026-08-07 13:17:47.746'
  );
INSERT INTO
  `journal_templates` (
    `id`,
    `company_id`,
    `name`,
    `description`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'd66cd177-9fe7-4674-b012-29ee3731c2ea',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'first account',
    NULL,
    '2026-08-07 13:12:01.657',
    '2026-08-07 13:12:01.657'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: landing_page_config
# ------------------------------------------------------------

INSERT INTO
  `landing_page_config` (`id`, `config`, `updated_at`)
VALUES
  (
    1,
    '{\"hero\": {\"titleLine1\": \"Africa\'s development story\", \"titleLine2\": \"deserves investment-grade visibility\"}, \"theme\": {\"accentColor\": \"#f9a11b\", \"primaryColor\": \"#05c1ff\"}}',
    '2026-08-07 11:11:05.000'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: pages
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: payment_allocations
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: payment_gateways
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: profiles
# ------------------------------------------------------------

INSERT INTO
  `profiles` (`id`, `business_name`, `currency`, `created_at`)
VALUES
  (
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'Nutech Business',
    'NGN',
    '2026-08-07 11:53:17.596'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: recurring_schedules
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: sales_invoice_lines
# ------------------------------------------------------------

INSERT INTO
  `sales_invoice_lines` (
    `id`,
    `invoice_id`,
    `description`,
    `quantity`,
    `unit_price`,
    `amount`,
    `tax_rate`,
    `created_at`
  )
VALUES
  (
    '167089e5-958b-4b3e-a633-38d6e35c9a2f',
    '0974ce4d-266e-418c-8d23-e5968bd8a612',
    'test',
    1.00,
    500.00,
    500.00,
    5.00,
    '2026-08-07 19:36:42.786'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: sales_invoices
# ------------------------------------------------------------

INSERT INTO
  `sales_invoices` (
    `id`,
    `company_id`,
    `customer_id`,
    `invoice_number`,
    `issue_date`,
    `due_date`,
    `status`,
    `subtotal`,
    `tax_amount`,
    `total_amount`,
    `notes`,
    `terms`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '0974ce4d-266e-418c-8d23-e5968bd8a612',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    '3302da80-28aa-45aa-b493-4da89fe72919',
    'INV-363383',
    '2026-08-07 00:00:00.000',
    '2026-09-06 00:00:00.000',
    'SENT',
    500.00,
    25.00,
    525.00,
    '',
    NULL,
    '2026-08-07 19:36:42.786',
    '2026-08-07 19:56:09.856'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: system_settings
# ------------------------------------------------------------

INSERT INTO
  `system_settings` (`id`, `key`, `value`, `created_at`, `updated_at`)
VALUES
  (
    '2fb6b4ca-0021-457d-99da-cfb5ccc04de1',
    'subscriptionPrice',
    '10',
    '2026-08-15 22:08:38.083',
    '2026-08-15 22:08:38.083'
  );
INSERT INTO
  `system_settings` (`id`, `key`, `value`, `created_at`, `updated_at`)
VALUES
  (
    '65927c62-ce30-4518-b95b-1f584ec47911',
    'appName',
    'MyKoboBooks',
    '2026-08-15 22:08:38.083',
    '2026-08-15 22:08:38.083'
  );
INSERT INTO
  `system_settings` (`id`, `key`, `value`, `created_at`, `updated_at`)
VALUES
  (
    '71bdd17c-a9f8-4708-ba1f-2df3c3c8125e',
    'smtpEnabled',
    'false',
    '2026-08-15 22:08:38.083',
    '2026-08-15 22:08:38.083'
  );
INSERT INTO
  `system_settings` (`id`, `key`, `value`, `created_at`, `updated_at`)
VALUES
  (
    '7a41fa58-9e8a-47c2-8c11-e54a28424821',
    'smtpHost',
    '',
    '2026-08-15 22:08:38.083',
    '2026-08-15 22:08:38.083'
  );
INSERT INTO
  `system_settings` (`id`, `key`, `value`, `created_at`, `updated_at`)
VALUES
  (
    '7a74e509-9d6f-4886-bf82-9fdc556d5180',
    'smtpUser',
    '',
    '2026-08-15 22:08:38.083',
    '2026-08-15 22:08:38.083'
  );
INSERT INTO
  `system_settings` (`id`, `key`, `value`, `created_at`, `updated_at`)
VALUES
  (
    'b2234c4a-93dd-4eaa-ac01-c430c615764b',
    'appLogo',
    '',
    '2026-08-15 22:08:38.083',
    '2026-08-15 22:08:38.083'
  );
INSERT INTO
  `system_settings` (`id`, `key`, `value`, `created_at`, `updated_at`)
VALUES
  (
    'c4671576-1a2e-4c39-a2ca-0a33c26ca943',
    'smtpPass',
    '',
    '2026-08-15 22:08:38.083',
    '2026-08-15 22:08:38.083'
  );
INSERT INTO
  `system_settings` (`id`, `key`, `value`, `created_at`, `updated_at`)
VALUES
  (
    'f4df6ba7-c6a4-4a3c-af9e-d87d6a7e04b3',
    'smtpPort',
    '587',
    '2026-08-15 22:08:38.083',
    '2026-08-15 22:08:38.083'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: template_lines
# ------------------------------------------------------------

INSERT INTO
  `template_lines` (
    `id`,
    `template_id`,
    `account_id`,
    `debitRatio`,
    `creditRatio`,
    `is_fixed_amount`,
    `created_at`
  )
VALUES
  (
    '01382cde-ace1-48c3-b944-2e74faf69e1e',
    '2fae1b94-5759-42cf-b0fd-12b8af9111a5',
    'c33224d1-16d5-45d5-9410-06f8fa00b99a',
    0.0000,
    300.0000,
    1,
    '2026-08-07 13:04:44.793'
  );
INSERT INTO
  `template_lines` (
    `id`,
    `template_id`,
    `account_id`,
    `debitRatio`,
    `creditRatio`,
    `is_fixed_amount`,
    `created_at`
  )
VALUES
  (
    '1b674aef-ca77-4619-9490-ffbc6012b5a1',
    '0f6bdae9-141c-4887-8e99-9dcafdbfb8a9',
    'c33224d1-16d5-45d5-9410-06f8fa00b99a',
    0.0000,
    1000.0000,
    1,
    '2026-08-07 13:05:22.755'
  );
INSERT INTO
  `template_lines` (
    `id`,
    `template_id`,
    `account_id`,
    `debitRatio`,
    `creditRatio`,
    `is_fixed_amount`,
    `created_at`
  )
VALUES
  (
    '20ae54b5-3315-4cc7-8e55-7bf0b8411749',
    'd66cd177-9fe7-4674-b012-29ee3731c2ea',
    'bf0c88de-14fb-4895-b304-5264ea599214',
    0.0000,
    500.0000,
    1,
    '2026-08-07 13:12:01.657'
  );
INSERT INTO
  `template_lines` (
    `id`,
    `template_id`,
    `account_id`,
    `debitRatio`,
    `creditRatio`,
    `is_fixed_amount`,
    `created_at`
  )
VALUES
  (
    '44335045-b1b3-4f37-82af-fffbe1213ebe',
    'c35e14f1-daac-498e-bb1b-861c92cb8b26',
    'bf0c88de-14fb-4895-b304-5264ea599214',
    0.0000,
    1000.0000,
    1,
    '2026-08-07 13:17:47.746'
  );
INSERT INTO
  `template_lines` (
    `id`,
    `template_id`,
    `account_id`,
    `debitRatio`,
    `creditRatio`,
    `is_fixed_amount`,
    `created_at`
  )
VALUES
  (
    '5be26943-8e83-4483-9c8b-747d7b0b1416',
    'c35e14f1-daac-498e-bb1b-861c92cb8b26',
    'c33224d1-16d5-45d5-9410-06f8fa00b99a',
    0.0000,
    500.0000,
    1,
    '2026-08-07 13:17:47.746'
  );
INSERT INTO
  `template_lines` (
    `id`,
    `template_id`,
    `account_id`,
    `debitRatio`,
    `creditRatio`,
    `is_fixed_amount`,
    `created_at`
  )
VALUES
  (
    '755ee849-58f7-4b39-9767-f0848f3b96b3',
    '2fae1b94-5759-42cf-b0fd-12b8af9111a5',
    'bf0c88de-14fb-4895-b304-5264ea599214',
    0.0000,
    500.0000,
    1,
    '2026-08-07 13:04:44.793'
  );
INSERT INTO
  `template_lines` (
    `id`,
    `template_id`,
    `account_id`,
    `debitRatio`,
    `creditRatio`,
    `is_fixed_amount`,
    `created_at`
  )
VALUES
  (
    'b7c89d91-db67-492b-a62f-29c0e512f854',
    'd66cd177-9fe7-4674-b012-29ee3731c2ea',
    'c33224d1-16d5-45d5-9410-06f8fa00b99a',
    0.0000,
    200.0000,
    1,
    '2026-08-07 13:12:01.657'
  );
INSERT INTO
  `template_lines` (
    `id`,
    `template_id`,
    `account_id`,
    `debitRatio`,
    `creditRatio`,
    `is_fixed_amount`,
    `created_at`
  )
VALUES
  (
    'c1da87a2-10cb-4376-932b-35d2a9926b84',
    '0f6bdae9-141c-4887-8e99-9dcafdbfb8a9',
    'bf0c88de-14fb-4895-b304-5264ea599214',
    0.0000,
    500.0000,
    1,
    '2026-08-07 13:05:22.755'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: transactions
# ------------------------------------------------------------

INSERT INTO
  `transactions` (
    `id`,
    `user_id`,
    `direction`,
    `category`,
    `amount`,
    `occurred_on`,
    `counterparty`,
    `note`,
    `source`,
    `created_at`,
    `branch_id`,
    `company_id`,
    `created_by`,
    `category_id`
  )
VALUES
  (
    '41e733f0-ddea-42b7-b1b9-ed60223fbf20',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'outflow',
    'asset_purchase',
    200.00,
    '2026-08-07 00:00:00.000',
    'Dele',
    NULL,
    'manual',
    '2026-08-07 12:00:06.302',
    NULL,
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    NULL,
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `user_id`,
    `direction`,
    `category`,
    `amount`,
    `occurred_on`,
    `counterparty`,
    `note`,
    `source`,
    `created_at`,
    `branch_id`,
    `company_id`,
    `created_by`,
    `category_id`
  )
VALUES
  (
    '4ff87069-5776-45b4-b07c-db13682df900',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'inflow',
    'sales',
    100.00,
    '2026-08-07 00:00:00.000',
    'Dele',
    NULL,
    'manual',
    '2026-08-07 11:57:39.813',
    NULL,
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    NULL,
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `user_id`,
    `direction`,
    `category`,
    `amount`,
    `occurred_on`,
    `counterparty`,
    `note`,
    `source`,
    `created_at`,
    `branch_id`,
    `company_id`,
    `created_by`,
    `category_id`
  )
VALUES
  (
    '80cd9784-9809-4563-a234-2aeb41c5cfe6',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'outflow',
    'Other',
    117.00,
    '2026-08-11 00:00:00.000',
    '1x Lorem ipsum s 3500',
    'Scanned receipt: images.png',
    'receipt_scan',
    '2026-08-11 23:03:55.592',
    NULL,
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    '52b25cc2-b941-4119-8c7f-f6f17ae84f31'
  );
INSERT INTO
  `transactions` (
    `id`,
    `user_id`,
    `direction`,
    `category`,
    `amount`,
    `occurred_on`,
    `counterparty`,
    `note`,
    `source`,
    `created_at`,
    `branch_id`,
    `company_id`,
    `created_by`,
    `category_id`
  )
VALUES
  (
    'c1a6455b-ab0b-4ce1-83d0-0070558951cc',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'outflow',
    'Other',
    117.00,
    '2026-08-11 00:00:00.000',
    '1x Lorem ipsum s 3500',
    'Scanned receipt: images.png',
    'receipt_scan',
    '2026-08-11 23:03:42.829',
    NULL,
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    '52b25cc2-b941-4119-8c7f-f6f17ae84f31'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: users
# ------------------------------------------------------------

INSERT INTO
  `users` (
    `id`,
    `email`,
    `password`,
    `role`,
    `subscription_status`,
    `trial_ends_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'ea8986f0-4fce-4fa6-afe1-01c41018aedc',
    'nutech2025@gmail.com',
    '$2b$10$Y9CAhqcC2V3xCUAgnBiaTOrF4Up3wsxzTF7cDR6l59PaEDjtFCenu',
    'Admin',
    NULL,
    NULL,
    '2026-08-07 11:53:17.596',
    '2026-08-07 11:53:17.596'
  );

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
