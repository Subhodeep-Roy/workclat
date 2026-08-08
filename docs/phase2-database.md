# Phase 2: Database Design

## Implemented schema

The database design now includes the core entities required for VendorFlow AI:

- roles
- users
- vendors
- departments
- budgets
- purchase_orders
- invoices
- invoice_items
- approval_requests
- payments
- notifications
- audit_logs

## Files added

- database/schema.sql - PostgreSQL DDL for the full schema
- database/seed.sql - starter data for roles, users, vendors, departments, and budgets
- backend/app/models/base.py - SQLAlchemy declarative base
- backend/app/models/finance.py - ORM models for the finance domain
- backend/app/database.py - database engine and initialization helper

## Next step

The next phase will build the FastAPI endpoints and authentication layer around this schema.
