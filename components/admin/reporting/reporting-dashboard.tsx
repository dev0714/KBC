'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ArrowUpRight, BarChart3, Clock3, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import type { ReportingModel } from '@/lib/admin/reporting'

type ReportingDashboardProps = {
  orders: any[]
  clients: any[]
  reporting: ReportingModel
}

type ReportKey = 'overview' | 'products' | 'customers' | 'orders' | 'revenue' | 'peak'

const reportCards: Array<{
  key: Exclude<ReportKey, 'overview'>
  label: string
  description: string
  icon: typeof Package
}> = [
  {
    key: 'products',
    label: 'Total Products',
    description: 'Sales by product, highest to lowest.',
    icon: Package,
  },
  {
    key: 'customers',
    label: 'Customers',
    description: 'Top buyers ranked by total spend.',
    icon: Users,
  },
  {
    key: 'orders',
    label: 'Total Orders',
    description: 'Largest orders sorted by value.',
    icon: ShoppingCart,
  },
  {
    key: 'revenue',
    label: 'Total Revenue',
    description: 'Daily sales trend over time.',
    icon: TrendingUp,
  },
  {
    key: 'peak',
    label: 'Peak Time',
    description: 'Order volume by hour of day.',
    icon: Clock3,
  },
]

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(214 95% 58%)',
  },
  count: {
    label: 'Orders',
    color: 'hsl(142 76% 44%)',
  },
} as const

export function ReportingDashboard({ orders, clients, reporting }: ReportingDashboardProps) {
  const [selectedReport, setSelectedReport] = useState<ReportKey>('overview')

  const totalRevenue = useMemo(
    () => reporting.dailyRevenue.reduce((sum, entry) => sum + entry.revenue, 0),
    [reporting.dailyRevenue],
  )

  const peakBucket = useMemo(
    () => {
      const activeBuckets = reporting.peakTimeBuckets.filter((bucket) => bucket.count > 0)
      if (!activeBuckets.length) return null

      return activeBuckets.reduce<{ label: string; count: number } | null>((peak, bucket) => {
        if (!peak || bucket.count > peak.count) return bucket
        return peak
      }, null)
    },
    [reporting.peakTimeBuckets],
  )

  const metrics = [
    {
      key: 'products' as const,
      label: 'Total Products',
      value: reporting.productRankings.length.toLocaleString(),
      helper: reporting.productRankings.length ? `${reporting.productRankings[0].title} leads the board` : 'No product sales yet',
      icon: Package,
    },
    {
      key: 'customers' as const,
      label: 'Customers',
      value: reporting.customerRankings.length.toLocaleString(),
      helper: reporting.customerRankings.length ? `${reporting.customerRankings[0].client_name} is top customer` : 'No customer spend yet',
      icon: Users,
    },
    {
      key: 'orders' as const,
      label: 'Total Orders',
      value: reporting.orderRankings.length.toLocaleString(),
      helper: reporting.orderRankings.length ? `${reporting.orderRankings[0].order_number} is the largest order` : 'No orders yet',
      icon: ShoppingCart,
    },
    {
      key: 'revenue' as const,
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      helper: reporting.dailyRevenue.length ? `${reporting.dailyRevenue.length} active sales days` : 'No revenue recorded yet',
      icon: TrendingUp,
    },
    {
      key: 'peak' as const,
      label: 'Peak Time',
      value: peakBucket?.label || 'N/A',
      helper: peakBucket ? `${peakBucket.count.toLocaleString()} orders in the busiest bucket` : 'No timing data yet',
      icon: Clock3,
    },
  ]

  const revenueChartData = reporting.dailyRevenue.map((entry) => ({
    date: formatDayLabel(entry.label),
    revenue: entry.revenue,
  }))

  const peakChartData = reporting.peakTimeBuckets.map((entry) => ({
    label: entry.label,
    count: entry.count,
  }))

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-[#071c4c] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/45">Reporting</p>
            <h1 className="text-3xl font-black tracking-tight text-white">Drill into sales, customers, and timing</h1>
            <p className="max-w-2xl text-sm leading-6 text-white/70">
              Use the summary tiles to jump into product performance, buyer rankings, order value, daily revenue, and peak-time activity.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            <div className="flex items-center gap-2 font-semibold">
              <ArrowUpRight className="h-4 w-4" />
              Live reporting
            </div>
            <p className="mt-1 text-cyan-50/75">
              {orders.length.toLocaleString()} orders, {clients.length.toLocaleString()} customers
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => {
            const Icon = metric.icon
            const isActive = selectedReport === metric.key
            return (
              <button
                key={metric.key}
                type="button"
                onClick={() => setSelectedReport(metric.key)}
                className={cn(
                  'group rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/60',
                  isActive
                    ? 'border-red-400/70 bg-red-500/15 shadow-[0_12px_30px_rgba(239,68,68,0.18)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/45">{metric.label}</p>
                    <div className="mt-3 text-3xl font-black tracking-tight text-white">{metric.value}</div>
                  </div>
                  <div
                    className={cn(
                      'rounded-2xl p-3 transition-transform duration-200 group-hover:-translate-y-0.5',
                      isActive ? 'bg-red-500 text-white' : 'bg-white/10 text-white/80',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/65">{metric.helper}</p>
              </button>
            )
          })}
        </div>
      </div>

      {selectedReport === 'overview' ? (
        <OverviewPanel
          reporting={reporting}
          totalRevenue={totalRevenue}
          peakBucket={peakBucket}
          onSelect={setSelectedReport}
        />
      ) : selectedReport === 'products' ? (
        <DrilldownCard
          title="Product Sales"
          subtitle="Products ranked by revenue, with unit totals and performance."
          icon={Package}
          onBack={() => setSelectedReport('overview')}
        >
          {reporting.productRankings.length ? (
            <RankingTable
              columns={[
                { key: 'sku', label: 'SKU' },
                { key: 'title', label: 'Product' },
                { key: 'unitsSold', label: 'Units Sold', align: 'right' },
                { key: 'revenue', label: 'Revenue', align: 'right' },
              ]}
              rows={reporting.productRankings.map((item) => ({
                sku: item.sku,
                title: item.title,
                unitsSold: item.unitsSold.toLocaleString(),
                revenue: formatCurrency(item.revenue),
              }))}
            />
          ) : (
            <EmptyState title="No sales data available yet." description="Once orders contain product lines, they will appear here from highest to lowest revenue." />
          )}
        </DrilldownCard>
      ) : selectedReport === 'customers' ? (
        <DrilldownCard
          title="Customer Rankings"
          subtitle="Customers ranked by purchase volume and total spend."
          icon={Users}
          onBack={() => setSelectedReport('overview')}
        >
          {reporting.customerRankings.length ? (
            <RankingTable
              columns={[
                { key: 'account_no', label: 'Account' },
                { key: 'client_name', label: 'Customer' },
                { key: 'orderCount', label: 'Orders', align: 'right' },
                { key: 'totalSpend', label: 'Spend', align: 'right' },
              ]}
              rows={reporting.customerRankings.map((item) => ({
                account_no: item.account_no || '—',
                client_name: item.client_name,
                orderCount: item.orderCount.toLocaleString(),
                totalSpend: formatCurrency(item.totalSpend),
              }))}
            />
          ) : (
            <EmptyState title="No customer activity yet." description="When customers place orders, they will appear in spend order here." />
          )}
        </DrilldownCard>
      ) : selectedReport === 'orders' ? (
        <DrilldownCard
          title="Order Rankings"
          subtitle="Orders sorted from highest to lowest value."
          icon={ShoppingCart}
          onBack={() => setSelectedReport('overview')}
        >
          {reporting.orderRankings.length ? (
            <RankingTable
              columns={[
                { key: 'order_number', label: 'Order #' },
                { key: 'client_name', label: 'Customer' },
                { key: 'total_amount', label: 'Total', align: 'right' },
                { key: 'payment_status', label: 'Status', align: 'right' },
              ]}
              rows={reporting.orderRankings.map((item) => ({
                order_number: item.order_number,
                client_name: item.client_name,
                total_amount: formatCurrency(item.total_amount),
                payment_status: item.payment_status,
              }))}
            />
          ) : (
            <EmptyState title="No orders found for this period." description="Once orders exist, the biggest ones will appear first in this view." />
          )}
        </DrilldownCard>
      ) : selectedReport === 'revenue' ? (
        <DrilldownCard
          title="Daily Revenue"
          subtitle="A day-by-day view of sales totals."
          icon={TrendingUp}
          onBack={() => setSelectedReport('overview')}
        >
          {revenueChartData.length ? (
            <ChartContainer config={chartConfig} className="h-[340px] w-full">
              <LineChart data={revenueChartData} margin={{ left: 8, right: 16, top: 12, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} width={80} tickFormatter={(value) => `R${Number(value).toLocaleString()}`} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <EmptyState title="No revenue data available yet." description="Daily sales will appear here once the system records paid orders." />
          )}
        </DrilldownCard>
      ) : (
        <DrilldownCard
          title="Peak Time"
          subtitle="Hourly order volume shows when your customers are most active."
          icon={Clock3}
          onBack={() => setSelectedReport('overview')}
        >
          {peakChartData.some((entry) => entry.count > 0) ? (
            <ChartContainer config={chartConfig} className="h-[340px] w-full">
              <BarChart data={peakChartData} margin={{ left: 8, right: 16, top: 12, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]}>
                  <LabelList dataKey="count" position="top" className="fill-white/80 text-xs font-semibold" />
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState title="No peak-time data yet." description="Once orders are placed, this chart will show the busiest times of day." />
          )}
        </DrilldownCard>
      )}
    </div>
  )
}

function OverviewPanel({
  reporting,
  totalRevenue,
  peakBucket,
  onSelect,
}: {
  reporting: ReportingModel
  totalRevenue: number
  peakBucket: { label: string; count: number } | null
  onSelect: (report: ReportKey) => void
}) {
  const highlights = [
    reporting.productRankings[0]
      ? `Top product: ${reporting.productRankings[0].title}`
      : 'No product sales have been recorded yet.',
    reporting.customerRankings[0]
      ? `Top customer: ${reporting.customerRankings[0].client_name}`
      : 'No customer spend has been recorded yet.',
    reporting.orderRankings[0]
      ? `Largest order: ${reporting.orderRankings[0].order_number}`
      : 'No orders are available yet.',
    reporting.dailyRevenue.length
      ? `Daily revenue spans ${reporting.dailyRevenue.length} active day${reporting.dailyRevenue.length === 1 ? '' : 's'}.`
      : 'Daily revenue chart will appear once sales exist.',
    peakBucket
      ? `Peak time: ${peakBucket.label} (${peakBucket.count} order${peakBucket.count === 1 ? '' : 's'}).`
      : 'Peak-time chart will appear once orders exist.',
  ]

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <DrilldownCard
        title="Overview"
        subtitle="A quick snapshot of the reporting workspace."
        icon={BarChart3}
        onBack={undefined}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryMiniCard title="Revenue" value={formatCurrency(totalRevenue)} />
          <SummaryMiniCard title="Products ranked" value={reporting.productRankings.length.toLocaleString()} />
          <SummaryMiniCard title="Customers ranked" value={reporting.customerRankings.length.toLocaleString()} />
          <SummaryMiniCard title="Orders ranked" value={reporting.orderRankings.length.toLocaleString()} />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/45">What you can drill into</p>
          <div className="mt-3 space-y-3 text-sm leading-6 text-white/75">
            {highlights.map((item) => (
              <div key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-red-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </DrilldownCard>

      <DrilldownCard title="Shortcuts" subtitle="Jump straight into a detailed report." icon={ArrowUpRight}>
        <div className="grid gap-3">
          {reportCards.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => onSelect(card.key)}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:border-white/20 hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-white/10 p-2 text-white/80">
                  <card.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-white">{card.label}</p>
                  <p className="text-sm text-white/55">{card.description}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/40" />
            </button>
          ))}
        </div>
      </DrilldownCard>
    </div>
  )
}

function DrilldownCard({
  title,
  subtitle,
  icon: Icon,
  onBack,
  children,
}: {
  title: string
  subtitle: string
  icon: typeof Package
  onBack?: () => void
  children: ReactNode
}) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-[#082256] p-5 shadow-[0_18px_60px_rgba(2,8,23,0.25)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/45">{subtitle}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10"
            >
              Back to overview
            </button>
          ) : null}
          <div className="rounded-2xl bg-red-500 p-3 text-white shadow-lg shadow-red-500/30">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function SummaryMiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">{title}</p>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
    </div>
  )
}

function RankingTable({
  columns,
  rows,
}: {
  columns: Array<{ key: string; label: string; align?: 'left' | 'right' }>
  rows: Array<Record<string, string>>
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-white/5">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/45',
                  column.align === 'right' ? 'text-right' : 'text-left',
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-[#061a44]">
          {rows.map((row, index) => (
            <tr key={`${index}-${Object.values(row).join('-')}`} className="hover:bg-white/5">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-4 text-sm text-white/80',
                    column.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center">
      <p className="text-lg font-bold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-white/60">{description}</p>
    </div>
  )
}

function formatCurrency(amount: number) {
  return `R${Number(amount || 0).toLocaleString('en-ZA')}`
}

function formatDayLabel(label: string) {
  const parsed = new Date(`${label}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return label
  return parsed.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}
