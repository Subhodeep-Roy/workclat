"""
Agent 4 — Budget Agent
Variance & Budget Check:
  - Verifies invoice total against the department's remaining budget
  - Applies dynamic tolerance thresholds: small shipping/incidental variances
    are auto-approved; significant overruns generate an exception
  - Prevents manager fatigue over trivial amounts (e.g. a $15 variance on $5,000)
"""
from __future__ import annotations

# ── Departmental budget database (simulates ERP / finance system) ────────────
# Real implementation: query ERP budgets table.
# Keys: department name (case-insensitive).  Values: { allocated, spent }.
_DEPARTMENT_BUDGETS: dict[str, dict] = {
    "engineering":    {"allocated": 500_000.00, "spent": 312_400.00},
    "operations":     {"allocated": 800_000.00, "spent": 755_100.00},
    "finance":        {"allocated": 200_000.00, "spent": 88_200.00},
    "procurement":    {"allocated": 350_000.00, "spent": 210_600.00},
    "infrastructure": {"allocated": 600_000.00, "spent": 422_800.00},
    "it":             {"allocated": 250_000.00, "spent": 168_900.00},
    "general":        {"allocated": 100_000.00, "spent": 34_500.00},
    "hr":             {"allocated": 150_000.00, "spent": 91_200.00},
    "marketing":      {"allocated": 300_000.00, "spent": 198_700.00},
    "legal":          {"allocated": 120_000.00, "spent": 67_400.00},
}

# ── Tolerance rules ───────────────────────────────────────────────────────────
# If the invoice amount exceeds the remaining budget by less than these values,
# it is auto-approved.  Above these, it becomes an exception_budget.
ABSOLUTE_TOLERANCE_USD  = 50.00    # up to $50 over remaining budget → auto-approve
RELATIVE_TOLERANCE_PCT  = 0.01     # up to 1% over remaining budget → auto-approve

# Variance against PO auto-approval (absolute): small line variances (e.g. shipping)
SHIPPING_VARIANCE_ABS   = 25.00    # if invoice > PO but difference ≤ $25 → note only, no exception


def run_budget_agent(payload) -> tuple[str | None, list[str]]:
    """
    Runs the budget & variance check pipeline.

    Returns
    -------
    (exception_status | None, notes)
        Returns None when the invoice clears budget checks (auto-approved or within tolerance).
        Returns "exception_budget" when a meaningful overrun is detected.
    """
    notes: list[str] = []
    dept_key = (payload.department or "General").strip().lower()
    budget = _DEPARTMENT_BUDGETS.get(dept_key)

    if budget is None:
        # Unknown department — flag for review but don't hard-block
        notes.append(
            f"Agent 4: Department '{payload.department}' not found in budget system — "
            "cannot verify budget; manual review recommended"
        )
        return None, notes

    allocated = budget["allocated"]
    spent     = budget["spent"]
    remaining = allocated - spent
    amount    = payload.total_amount

    notes.append(
        f"Agent 4: Department '{payload.department}' — "
        f"Allocated: ${allocated:,.0f} | Spent: ${spent:,.0f} | Remaining: ${remaining:,.0f}"
    )

    # ── Budget check ──────────────────────────────────────────────────────────
    if amount <= remaining:
        # Invoice fits within remaining budget — straightforward pass
        new_remaining = remaining - amount
        notes.append(
            f"Agent 4: Invoice ${amount:,.2f} fits within remaining budget "
            f"(${remaining:,.2f} → ${new_remaining:,.2f} after posting) ✓"
        )
        # Update simulated budget (in-memory)
        budget["spent"] += amount
        return None, notes

    # Invoice exceeds remaining budget — check tolerance
    overrun = amount - remaining
    overrun_pct = (overrun / remaining) if remaining > 0 else float("inf")

    if overrun <= ABSOLUTE_TOLERANCE_USD or overrun_pct <= RELATIVE_TOLERANCE_PCT:
        # Within dynamic tolerance — auto-approve with note
        notes.append(
            f"Agent 4: Invoice exceeds remaining budget by ${overrun:,.2f} "
            f"({overrun_pct * 100:.1f}%) — within dynamic tolerance threshold "
            f"(≤${ABSOLUTE_TOLERANCE_USD:.0f} or ≤{int(RELATIVE_TOLERANCE_PCT * 100)}%) — auto-approved ✓"
        )
        budget["spent"] += amount
        return None, notes

    # Significant overrun — raise exception
    notes.append(
        f"Agent 4: ⚠️  Budget overrun — Invoice ${amount:,.2f} exceeds remaining "
        f"${remaining:,.2f} by ${overrun:,.2f} ({overrun_pct * 100:.1f}%) — "
        "exceeds tolerance thresholds → exception_budget"
    )
    return "exception_budget", notes
