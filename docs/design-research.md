# Design Research & UI Specification — TraceForge

> **Project**: TraceForge API Observability  
> **Category**: Developer Tools & API Telemetry Console  
> **Researcher**: Design Research Agent & Technical Lead  
> **Visual Reference Paradigm**: Datadog, Axiom, Better Stack, Sentry Performance, Grafana  

---

## 1. Product Identity & Design Direction

Unlike task-driven SaaS dashboards (Sprintly) or warm academic document readers (SourceLens), **TraceForge** is engineered as a **cybernetic, high-density developer observability console**.

- **Core Metaphor**: *The SRE Operations Deck* — Crisp, dark, high-contrast, designed for site reliability engineers diagnosing real-time microservice anomalies under pressure.
- **Styling Architecture**: **Tailwind CSS v4** with a custom Dark Obsidian theme, monospaced numeric scales, and custom hand-crafted SVG data visualizations.
- **Visual Personality**: Deep void black surfaces (`#080B11`) layered with charcoal slate cards (`#0F172A`), hair-thin borders (`#1E293B`), neon telemetry accents (Cyan `#06B6D4`, Emerald `#10B981`, Amber `#F59E0B`, Rose `#F43F5E`), and pulsating live traffic indicators.

---

## 2. Color Palette & Semantic Tokens

| Token Name | Hex Value | Purpose / Semantic Role | Contrast (vs #080B11) |
|---|---|---|---|
| `--bg-void` | `#080B11` | Application background (deep space void) | — |
| `--bg-card` | `#0F172A` | Primary container & panel surface | 1.2:1 |
| `--bg-surface-elevated`| `#1E293B` | Hover states, active tabs, drawer header | 2.1:1 |
| `--border-subtle` | `#1E293B` | 1px border lines on cards and table rows | — |
| `--border-strong` | `#334155` | Focused borders, active filter chips | — |
| `--text-primary` | `#F8FAFC` | Main headings, latency metrics, code values | 18.2:1 (AAA) |
| `--text-secondary` | `#94A3B8` | Labels, table headers, breadcrumbs | 8.9:1 (AAA) |
| `--text-muted` | `#64748B` | Timestamps, inactive pagination, IP addresses | 5.2:1 (AA) |
| `--accent-cyan` | `#06B6D4` | Primary brand accent, selected traces, interactive links | 8.8:1 (AAA) |
| `--status-2xx` (Emerald)| `#10B981` | Successful HTTP requests (200, 201), healthy services | 8.5:1 (AAA) |
| `--status-4xx` (Amber) | `#F59E0B` | Client errors (400, 401, 403, 404, 429), degraded services | 9.4:1 (AAA) |
| `--status-5xx` (Rose) | `#F43F5E` | Server errors (500, 502, 503, 504), critical incidents | 6.8:1 (AAA) |

---

## 3. Typography & Hierarchy

Observability requires strict vertical alignment for numbers, timestamps, and IDs. We pair a modern clean geometric sans font for navigation with a monospaced typeface for all metrics:

- **Primary UI Font**: Inter / Plus Jakarta Sans (`font-sans`)
  - Dashboard Title: `18px / SemiBold` (`font-semibold tracking-tight`)
  - Section Headers: `14px / Medium` (`font-medium text-slate-300`)
  - Filter Buttons & Tabs: `13px / Medium`
  - Body Text: `13px / Regular`
- **Telemetry & Code Font**: JetBrains Mono / SFMono / Fira Code (`font-mono`)
  - Primary Metric KPIs: `28px / Bold` (`font-mono font-bold tracking-tight`)
  - Latency Numbers ($p50, p95, p99$): `13px / Medium`
  - HTTP Status Codes: `12px / SemiBold` (pill container)
  - HTTP Methods (`GET`, `POST`, `PUT`, `DELETE`): `11px / Bold` (fixed width `w-14 text-center`)
  - Trace IDs & Timestamps: `12px / Regular text-slate-400`

---

## 4. Component Patterns & Visual Layouts

### A. High-Density Top Navigation & Telemetry Banner
- **Header**: Compact 56px fixed bar with live traffic simulation toggle (`Play / Pause`), simulation speed selector (`1x`, `2x`, `5x`), and a 1-click **Reset Telemetry Data** button.
- **Pulsing Indicator**: An animated pulsing green dot indicates active traffic generation:
  ```html
  <span class="relative flex h-2 w-2">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
  </span>
  ```

### B. Metric Summary Cards (KPI Grid)
Four high-contrast KPI cards across the top:
1. **Total Requests**: Current volume + throughput (Req/s).
2. **Error Rate (%)**: Dynamic color coding (< 1% Emerald, 1-5% Amber, > 5% Rose).
3. **P95 Latency**: Target threshold indicator (e.g., `142ms` vs `300ms SLA`).
4. **Active Incidents**: Count of tripped alert thresholds with severity badges.

### C. Accessible Hand-Crafted SVG Visualizations
- **Latency Distribution & Throughput Chart**:
  - Dual-layer responsive SVG: bar charts for request throughput overlaid with a smooth cubic Bézier spline for $p95$ latency.
  - Hover tooltip crosshair tracking exact time bucket, request volume, and latency.
- **Status Code Doughnut Ring**:
  - Accessible SVG circle with `stroke-dasharray` and `stroke-dashoffset` representing 2xx, 4xx, and 5xx proportions.
  - Centered text display showing overall success percentage (e.g. `94.2%`).

### D. Endpoint Registry Grid
A dedicated view tab listing registered microservice routes (`/api/v1/auth/login`, `/api/v1/payments/charge`, etc.) with:
- Health badge (`Healthy` green, `Degraded` yellow, `Critical` red).
- Methods supported.
- Traffic share (% of total).
- $p50$, $p90$, $p95$, $p99$ columns.
- Direct "Filter Stream" action to isolate requests for that route.

### E. Trace Stream Table
High-density tabular log with:
- Colored method badge (`GET` cyan, `POST` emerald, `PUT` amber, `DELETE` rose).
- Status code pill with colored background.
- Endpoint path with query string preview.
- Latency bar indicator (micro bar representing relative duration from 0 to 1000ms).
- Region pill (`us-east`, `eu-west`, `ap-southeast`).
- Relative timestamp with absolute ISO tooltip.
- Clicking any row slides open the **Request & Trace Inspector Drawer**.

### F. Deep-Dive Request & Waterfall Trace Inspector
Slide-over drawer on the right (600px width on desktop) featuring:
- **Header Section**: Full URL, status, duration, timestamp, client IP, user agent.
- **Waterfall Trace View**:
  - Visual timeline breakdown showing time spent in:
    1. `api-gateway` (Routing & Rate Limit)
    2. `auth-service` (JWT validation)
    3. `handler` (Business logic)
    4. `postgres` / `redis` (Database query execution)
    5. `payment-gateway` / external API (where applicable)
    6. `serializer` (Response encoding)
  - Color-coded span bars with duration labels and status indicators.
- **Payload Tabs**: Syntax-highlighted Request Headers, Request Body, Response Headers, Response Body.

---

## 5. Motion, Animation & Accessibility

- **Motion Restraint**: Animations are strictly functional (pulsing dot for live status, smooth drawer slide, chart tooltip transitions). All motion obeys `@media (prefers-reduced-motion: reduce)`.
- **Keyboard Navigation**:
  - <kbd>Esc</kbd> closes the Request Inspector drawer and Alert modal.
  - Arrow keys or <kbd>Tab</kbd> cycle through table rows.
  - <kbd>Space</kbd> toggles simulation playback.
- **Color Independence**: Status is never conveyed by color alone; every status code carries explicit numeric text (`200 OK`, `404 Not Found`, `500 Internal Server Error`) and icons.

---

## 6. Design References Inspected & Validated

1. **21st.dev** ([21st.dev/s/dashboard](https://21st.dev/s/dashboard)):
   - Inspected: Dark theme metrics cards with micro-charts, compact status badges with live pulsing indicators, and developer log viewer layouts.
2. **React Bits** ([reactbits.dev](https://reactbits.dev)):
   - Inspected: `Counter` and `Count Up` micro-animations for live metric ticks, and subtle pulse states.
3. **Better Stack** ([betterstack.com](https://betterstack.com)):
   - Inspected: Terminal-grade dark mode palettes (`#080B11`), high-density log streams, and status timeline segments.
4. **Grafana & Datadog APM**:
   - Inspected: Latency percentile calculations ($p50/p90/p95/p99$), multi-service waterfall trace timelines, and threshold alert visualization.
