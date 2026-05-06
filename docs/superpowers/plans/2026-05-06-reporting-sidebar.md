# Reporting Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `Reporting` sidebar section in the admin area with clickable summary cards that drill into product, customer, order, revenue, and peak-time analytics.

**Architecture:** Keep the existing admin shell in `app/admin/page.tsx`, but move reporting-specific rendering into a focused reporting component so the main admin page does not grow further. Use the current `/api/admin` payload as the source of truth and derive rankings and graphs on the client with a small pure helper module in `lib/admin/reporting.ts`. Recharts is already available in the repo, so the reporting page can use it for the revenue and peak-time visualizations without adding backend complexity.

**Tech Stack:** Next.js App Router, React, TypeScript, existing `/api/admin` endpoint, Recharts, current shadcn/ui components.

---

## File Structure

- Create: `lib/admin/reporting.ts`
- Create: `components/admin/reporting/reporting-dashboard.tsx`
- Modify: `app/admin/page.tsx`
- Modify: `app/api/admin/route.ts` only if the current payload proves insufficient during implementation
- Optional create: `scripts/reporting-smoke.ts` for pure helper verification

---

### Task 1: Create the reporting aggregation helpers

**Files:**
- Create: `lib/admin/reporting.ts`
- Create: `scripts/reporting-smoke.ts`

- [ ] **Step 1: Write the failing smoke test**

Create a tiny TypeScript smoke script that describes the intended reporting shape with hard-coded sample data and assertions. The script should fail until the helper exists and returns the expected sorted/aggregated model.

```ts
import assert from 'node:assert/strict'
import { buildReportingModel } from '../lib/admin/reporting'

const model = buildReportingModel({
  orders: [
    {
      order_number: 'ORD-1',
      client_account_no: 'MID001',
      client_name: 'Alpha',
      total_amount: 300,
      order_date: '2026-05-06T09:15:00Z',
      order_items: [{ sku: 'SKU-A', quantity: 3, price: 100, products: { title: 'Product A' } }],
    },
    {
      order_number: 'ORD-2',
      client_account_no: 'MID002',
      client_name: 'Beta',
      total_amount: 500,
      order_date: '2026-05-06T17:15:00Z',
      order_items: [{ sku: 'SKU-B', quantity: 5, price: 100, products: { title: 'Product B' } }],
    },
  ],
  clients: [
    { account_no: 'MID001', client_name: 'Alpha' },
    { account_no: 'MID002', client_name: 'Beta' },
  ],
})

assert.equal(model.orderRankings[0].order_number, 'ORD-2')
assert.equal(model.customerRankings[0].account_no, 'MID002')
assert.equal(model.productRankings[0].sku, 'SKU-B')
assert.equal(model.dailyRevenue[0].revenue, 800)
assert.equal(model.peakTimeBuckets.find((b) => b.label === 'Morning')?.count, 1)
```

- [ ] **Step 2: Run the smoke test and confirm it fails**

Run:

```bash
node --experimental-strip-types scripts/reporting-smoke.ts
```

Expected: fail with a missing export or missing function error before the helper is implemented.

- [ ] **Step 3: Implement the helper module**

Build `buildReportingModel(input)` plus the smaller ranking helpers it uses. The helper should return a model with these fields:

```ts
type ReportingModel = {
  productRankings: Array<{ sku: string; title: string; unitsSold: number; revenue: number }>
  customerRankings: Array<{ account_no: string; client_name: string; orderCount: number; totalSpend: number }>
  orderRankings: Array<{ order_number: string; client_name: string; total_amount: number; order_date: string; payment_status: string }>
  dailyRevenue: Array<{ label: string; revenue: number }>
  peakTimeBuckets: Array<{ label: string; count: number }>
}
```

The helper should:
- Aggregate product sales from `order_items`
- Aggregate customers by `client_account_no`
- Sort orders by `total_amount` descending
- Bucket revenue by calendar day
- Bucket peak-time activity by hour

- [ ] **Step 4: Re-run the smoke test and the app build**

Run:

```bash
node --experimental-strip-types scripts/reporting-smoke.ts
npm run build
```

Expected:
- Smoke test passes
- Build passes

- [ ] **Step 5: Commit**

```bash
git add lib/admin/reporting.ts scripts/reporting-smoke.ts
git commit -m "Add reporting aggregation helpers"
```

---

### Task 2: Build the reporting dashboard component

**Files:**
- Create: `components/admin/reporting/reporting-dashboard.tsx`

- [ ] **Step 1: Write the component against the helper output**

Create a reporting dashboard component that receives the existing admin payload and the computed reporting model:

```tsx
type ReportingDashboardProps = {
  orders: any[]
  clients: any[]
  reporting: ReportingModel
}
```

The component should:
- Render the five summary cards
- Keep a local `selectedReport` state with values `products`, `customers`, `orders`, `revenue`, and `peak`
- Switch the active drill-down when a card is clicked
- Render a default “overview” panel when nothing is selected

- [ ] **Step 2: Add the drill-down views**

Implement the following panels in the same component or as small local subcomponents:
- Product ranking table sorted by sales descending
- Customer ranking table sorted by purchases/spend descending
- Order ranking table sorted by value descending
- Revenue line chart using the daily revenue series
- Peak-time bar chart using the hourly buckets

Use the existing UI styling patterns already present in the admin page. Keep each panel self-contained so it can be swapped without touching the others.

- [ ] **Step 3: Add empty states**

If a panel has no data, render a clear empty state instead of an empty chart/table. Use text like `No sales data available yet.` or `No orders found for this period.` so the reporting page never crashes on sparse data.

- [ ] **Step 4: Verify the component compiles**

Run:

```bash
npm run build
```

Expected: pass with no TypeScript or runtime build errors.

- [ ] **Step 5: Commit**

```bash
git add components/admin/reporting/reporting-dashboard.tsx
git commit -m "Add reporting dashboard component"
```

---

### Task 3: Wire Reporting into the admin shell

**Files:**
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Add the sidebar item**

Add a `Reporting` item to the sidebar navigation list so it sits alongside Overview, Products, Customers, Orders, Payment, and Settings.

```tsx
{ id: 'reporting', label: 'Reporting', icon: Database }
```

- [ ] **Step 2: Render the reporting tab**

Import the new reporting dashboard component and render it when `activeTab === 'reporting'`:

```tsx
{activeTab === 'reporting' && (
  <ReportingDashboard
    orders={orders}
    clients={clients}
    reporting={buildReportingModel({ orders, clients })}
  />
)}
```

- [ ] **Step 3: Keep the operational dashboard unchanged**

Do not remove or rewrite the existing Overview, Products, Customers, Orders, Payment, or Settings sections. The reporting view should live beside them, not replace them.

- [ ] **Step 4: Verify the admin page still builds**

Run:

```bash
npm run build
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add app/admin/page.tsx
git commit -m "Add reporting sidebar tab"
```

---

### Task 4: Verify the drill-down flows in the browser

**Files:**
- No code changes unless a runtime issue appears

- [ ] **Step 1: Start the app and sign in**

Open the admin page in the browser, sign in, and navigate to `Reporting`.

- [ ] **Step 2: Verify each summary card drills correctly**

Click each card and confirm:
- `Total Products` shows a descending product sales table
- `Customers` shows a descending customer spend table
- `Total Orders` shows a descending order value table
- `Total Revenue` shows a daily revenue graph
- `Peak Time` shows an hourly order graph

- [ ] **Step 3: Verify empty-state behavior**

Filter or use a small dataset to confirm the page still renders useful messages when a chart or table has no rows.

- [ ] **Step 4: Verify no regressions**

Confirm the existing admin tabs still open normally and the reporting tab does not break logout, login management, or order views.

- [ ] **Step 5: Commit any follow-up fixes**

```bash
git add <any fixed files>
git commit -m "Polish reporting drill-down behavior"
```

---

## Review Checklist

- Product rankings sort by revenue descending.
- Customer rankings sort by total spend or purchase volume descending.
- Order rankings sort by total amount descending.
- Revenue chart uses daily totals.
- Peak-time chart uses hourly totals.
- Reporting is a dedicated sidebar section.
- Existing admin workflows remain intact.
