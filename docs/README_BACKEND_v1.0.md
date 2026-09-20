# RAPI-SULTRA Backend v1.0 (PoC)

**Status**: FROZEN FOR DASHBOARD INTEGRATION
**Date Frozen**: 2026-09-19

## Overview
This repository contains the v1.0 Frozen Backend for the RAPI-SULTRA Proof-of-Concept. It is designed to consume transaction footprints and process them sequentially through a prediction engine, financial mapping, duplicate detection, reconciliation engine, financial engine, financial profiler, and finally outputs the RAPI Financing Readiness Profile.

## Frozen Components
The following components are now immutable and locked for Dashboard Integration:
- Model V2 (`model/transaction_classifier_v2.pkl`)
- Prediction Engine
- Financial Mapping
- Duplicate Detection
- Reconciliation
- Financial Engine
- Financial Profile
- RAPI Financing Readiness Profile
- Presentation Dataset & Outputs (`reports/presentation/`)

## Strict Integration Rules
Dashboard developers **MUST NOT**:
1. Modify any business logic within the `src/` modules.
2. Retrain or alter `model/transaction_classifier_v2.pkl`.
3. Create their own aggregate credit scores or financing decision logic (e.g., "Approved" or "Rejected") on the frontend.
4. Alter the definition of the 4 dimensions (Revenue Stability, Account Consistency, Payment Behaviour, Information Completeness).

Any request for new data, features, or metric calculations must be evaluated as a new backend requirement and submitted to the Backend Team. The dashboard should act strictly as a consumer and visualization layer for the outputs located in `reports/presentation/`.
