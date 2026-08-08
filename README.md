# VendorFlow AI

VendorFlow AI is a production-oriented Accounts Payable automation platform for invoice intake, review, approval, and payment orchestration.

## Phase 1: System Architecture & Folder Structure

This phase establishes the implementation foundation:

- Monorepo structure for frontend, backend, AI services, database, and shared utilities
- Initial application shell for the Next.js frontend
- FastAPI backend entrypoint and configuration scaffold
- Architecture notes for role-based workflows and modular services

## Repository Layout

- frontend/ - Next.js 15 app router frontend
- backend/ - FastAPI backend services and API entrypoint
- ai/ - LangGraph and OCR workflow nodes
- database/ - schema and migration assets
- docs/ - architecture and implementation notes
- services/ - shared service abstractions
