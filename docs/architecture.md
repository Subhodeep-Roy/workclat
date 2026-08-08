# VendorFlow AI Architecture

## Overview

VendorFlow AI is organized as a modular SaaS platform with clear boundaries between:

- Frontend experience and routing
- Backend REST/API services
- Workflow orchestration and AI agents
- Database persistence and audit history
- Storage and notification integration

## Core Modules

### Frontend
- Landing page, auth screens, vendor portal, finance portal, admin views
- Shared UI shell with sidebar, navbar, cards, tables, charts, empty states, and loading skeletons

### Backend
- Authentication and RBAC
- Invoice lifecycle management
- OCR service integration
- Approval and payment orchestration
- Notification gateway abstraction

### AI Layer
- OCR workflow
- Extraction agent
- Purchase order matching agent
- Fraud detection agent
- Budget verification agent
- Approval routing agent
- Payment scheduling agent
- Audit agent

### Data Layer
- PostgreSQL with tables for users, roles, vendors, departments, budgets, purchase orders, invoices, invoice items, approvals, payments, notifications, and audit logs
