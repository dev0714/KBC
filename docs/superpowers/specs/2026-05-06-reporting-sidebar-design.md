# Reporting Sidebar Implementation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `Reporting` sidebar page to the admin area that turns the summary metrics into drill-down analytics views.

**Architecture:** The existing admin dashboard will stay focused on operations, while a new reporting page becomes the analytics hub. The reporting page will reuse the same admin shell and styling, but its main content will be organized around clickable summary cards and focused drill-down panels for product sales, customer purchase volume, order totals, revenue trends, and peak-time activity. Data should come from the existing admin data source first, then be reshaped on the client for ranking and chart presentation.

**Tech Stack:** Next.js App Router, React, existing admin data API, existing UI components, charting library already in the codebase if available, otherwise lightweight reusable chart components built in-app.

---

## Scope

This feature adds:
- A new `Reporting` item in the admin sidebar.
- A reporting page that uses the current admin data and presents it as drill-down analytics.
- Interactive summary tiles that open detailed ranked lists or charts.
- Clear navigation back to the existing admin overview and other tabs.

This feature does not add:
- New payment logic.
- New customer or order editing flows.
- New database tables unless the implementation discovers a hard requirement for one.

## UX Layout

The reporting page should feel like a dedicated analytics workspace, not a copy of the main dashboard.

Top section:
- Five summary cards for `Total Products`, `Customers`, `Total Orders`, `Total Revenue`, and `Peak Time`.
- Each card should be clickable.
- Clicking a card should switch the page into the related drill-down panel.

Drill-down panel behavior:
- `Total Products` opens a ranked product sales view from highest to lowest.
- `Customers` opens a customer ranking view ordered by total purchases or spend.
- `Total Orders` opens an order ranking view from highest value to lowest value.
- `Total Revenue` opens a daily revenue chart.
- `Peak Time` opens an hourly orders chart.

Default reporting view:
- Show the summary cards at the top.
- Show a compact analytics overview below them with the five drill-down panels visible in a stacked or tabbed form.
- The page should preserve the admin styling language already used in the app.

## Drill-Down Rules

### Total Products

Clicking this card should show a product performance table sorted by sales value, descending.
Each row should include:
- Product name
- SKU
- Units sold
- Revenue generated

### Customers

Clicking this card should show a customer ranking table sorted by total purchases or spend, descending.
Each row should include:
- Customer name
- Account number
- Order count
- Total spend

### Total Orders

Clicking this card should show an order ranking table sorted by order value, descending.
Each row should include:
- Order number
- Customer
- Date
- Total amount
- Status

### Total Revenue

Clicking this card should show a daily sales graph.
The graph should plot revenue by day over a sensible recent window, such as the current month or the last 30 days, depending on the data available.

### Peak Time

Clicking this card should show an hourly activity graph.
The graph should show the number of orders per hour bucket so the busiest ordering period is obvious at a glance.

## Data Handling

The page should reuse the existing admin data source instead of inventing a separate reporting backend.

The reporting view can derive:
- Product ranking from order item counts and item revenue.
- Customer ranking from orders grouped by account number or customer name.
- Order ranking from the existing orders list.
- Daily revenue from order dates and totals.
- Peak time from order timestamps grouped by hour.

If the current admin API does not provide enough detail for one of the drill-downs, the implementation may extend that API, but only with the minimum additional fields needed.

## Navigation

The sidebar should include `Reporting` alongside the existing admin sections.

Behavior:
- Selecting `Reporting` opens the reporting page.
- The existing `Overview`, `Products`, `Customers`, `Orders`, `Payment`, and `Settings` areas remain unchanged.
- The reporting page should not hijack or replace the existing operational dashboard.

## Error Handling

If analytics data is missing or unavailable:
- The page should show an empty-state message instead of crashing.
- Chart panels should degrade gracefully to “No data available” when the selected period has no rows.
- Summary cards should still render with zero values.

## Testing

The implementation should be verified by:
- Confirming the new sidebar item appears and navigates correctly.
- Confirming each summary card opens the correct drill-down view.
- Confirming product, customer, and order rankings sort in descending order.
- Confirming the revenue chart shows daily totals.
- Confirming the peak-time chart shows hourly totals.
- Confirming the reporting page still renders when the dataset is empty or partially missing.

## Open Implementation Notes

- The reporting page should follow the existing admin visual style rather than introducing a new theme.
- If the codebase already has a chart component, reuse it; otherwise create a small reusable chart wrapper rather than duplicating chart logic in multiple places.
- Keep the data shaping logic separate from the page shell so the rankings and graphs remain easy to maintain.
