import { test, expect } from '@playwright/test';

test.describe('VendorFlow AI — All 6 AP Automation Agents E2E Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to Login page and sign in as Admin
    await page.goto('/login');
    await page.fill('#email', 'admin@vendorflow.ai');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Wait until redirected away from login or landed on workspace
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('Agent 1: Ingests invoice, extracts fields & calculates confidence scores', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.locator('h2')).toContainText('Invoice Ingestion');

    // Click "Submit Invoice" button to reveal form
    await page.click('button:has-text("Submit Invoice")');

    // Fill invoice form
    await page.fill('#inv-number', `INV-PLAYWRIGHT-${Date.now().toString().slice(-4)}`);
    await page.fill('#inv-vendor', 'TechCorp Inc.');
    await page.fill('#inv-amount', '2500.00');
    await page.selectOption('#inv-dept', 'Engineering');

    // Submit form
    await page.click('button:has-text("Run Agent Pipeline")');

    // Verify Agent 1 OCR confidence results displayed
    await expect(page.locator('text=Agent 1 — OCR Confidence Scores')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Overall (Gate: ≥95%)')).toBeVisible();
  });

  test('Agent 2: Executes 3-Way Match (Invoice vs PO vs GRN)', async ({ page }) => {
    await page.goto('/invoices');
    await page.click('button:has-text("Submit Invoice")');

    // Test A: Clean 3-way match pass (PO-1001 + GRN-1028)
    const cleanInvNumber = `INV-MATCH-PASS-${Date.now().toString().slice(-4)}`;
    await page.fill('#inv-number', cleanInvNumber);
    await page.fill('#inv-vendor', 'Acme Supplies');
    await page.fill('#inv-amount', '1450.00');
    await page.selectOption('#inv-dept', 'Procurement');
    await page.fill('#inv-po', 'PO-1001');
    await page.fill('#inv-grn', 'GRN-1028');
    await page.fill('#inv-account', '****7711');
    await page.fill('#inv-routing', '021000021');

    await page.click('button:has-text("Run Agent Pipeline")');

    // Verify 3-way match passed
    await expect(page.locator('text=3-way match passed')).toBeVisible({ timeout: 10000 });

    // Test B: Missing GRN Exception
    await page.click('button:has-text("Submit Invoice")');
    const noGrnInvNumber = `INV-NOGRN-${Date.now().toString().slice(-4)}`;
    await page.fill('#inv-number', noGrnInvNumber);
    await page.fill('#inv-vendor', 'LogiTrans Global');
    await page.fill('#inv-amount', '12850.00');
    await page.selectOption('#inv-dept', 'Operations');
    await page.fill('#inv-po', 'PO-3100');
    // Leave GRN blank

    await page.click('button:has-text("Run Agent Pipeline")');
    await expect(page.locator('text=exception_grn').first()).toBeVisible({ timeout: 10000 });
  });

  test('Agent 3: Fraud Detection & Bank Authentication vs Vendor Master', async ({ page }) => {
    await page.goto('/invoices');
    await page.click('button:has-text("Submit Invoice")');

    const fraudInvNumber = `INV-FRAUD-${Date.now().toString().slice(-4)}`;
    await page.fill('#inv-number', fraudInvNumber);
    await page.fill('#inv-vendor', 'Acme Supplies');
    await page.fill('#inv-amount', '1450.00');
    await page.fill('#inv-po', 'PO-1001');
    await page.fill('#inv-grn', 'GRN-1028');
    // Intentional mismatched routing number
    await page.fill('#inv-account', '****7711');
    await page.fill('#inv-routing', '999999999');

    await page.click('button:has-text("Run Agent Pipeline")');

    // Verify Fraud Agent detected routing mismatch
    await expect(page.locator('text=Routing number mismatch').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Fraud Alert').first()).toBeVisible();
  });

  test('Agent 4: Budget & Variance Verification', async ({ page }) => {
    await page.goto('/invoices');
    await page.click('button:has-text("Submit Invoice")');

    const budgetInvNumber = `INV-BUDGET-${Date.now().toString().slice(-4)}`;
    await page.fill('#inv-number', budgetInvNumber);
    await page.fill('#inv-vendor', 'CloudScale Inc');
    await page.fill('#inv-amount', '8900.00');
    await page.selectOption('#inv-dept', 'Infrastructure');
    await page.fill('#inv-po', 'PO-8800');
    await page.fill('#inv-grn', 'GRN-8820');
    await page.fill('#inv-account', '****2255');
    await page.fill('#inv-routing', '026009593');

    await page.click('button:has-text("Run Agent Pipeline")');

    // Verify Budget Agent log
    await expect(page.locator('text=Agent 4: Department').first()).toBeVisible({ timeout: 10000 });
  });

  test('Agent 5: Exception Routing & Department Head Approval Workflow', async ({ page }) => {
    await page.goto('/approvals');
    await expect(page.locator('h2')).toContainText('Exception Routing');

    // Verify pending approvals queue
    const pendingCard = page.locator('text=Invoice inv-001').first();
    if (await pendingCard.isVisible()) {
      await pendingCard.click();
      await expect(page.locator('text=Agent 5 Exception Context').first()).toBeVisible();

      // Click Approve button
      await page.click('button:has-text("Approve")');
      await expect(page.locator('text=Decision saved').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Agent 6: Batch Payment Preparation & Controller Release to Treasury', async ({ page }) => {
    await page.goto('/payments');
    await expect(page.locator('h2')).toContainText('Batch Payment Preparation');

    // Step 1: Click "Prepare Batch" to aggregate approved invoices
    await page.click('button:has-text("Prepare Batch")');

    // Verify batch prepared
    await expect(page.locator('text=Agent 6: Batch compiled').first()).toBeVisible({ timeout: 8000 });

    // Step 2: Release batch as Controller
    const releaseBtn = page.locator('button:has-text("Release")').first();
    if (await releaseBtn.isVisible()) {
      await releaseBtn.click();
      await expect(page.locator('text=released to Treasury').first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('Full Workspace Verification: Dashboard & Analytics render correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Total Pending AP').first()).toBeVisible();

    await page.goto('/analytics');
    await expect(page.locator('h2')).toContainText('Analytics');
  });

});
