import { useMemo, useState } from 'react'
import {
  BarChart3,
  Download,
  Filter,
  LineChart as LineIcon,
  Mail,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SellerProtectedRoute } from '@/components/seller'

type Range = 'today' | '7d' | '30d' | '90d' | 'custom'

const RANGE_LABELS: Record<Range, string> = {
  today: 'Today',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  custom: 'Custom',
}

const KPI_DATA = {
  revenue: { value: 2450000, change: 12, spark: [10, 14, 12, 15, 18, 16, 20] },
  orders: { value: 428, change: 8, aov: 5724 },
  conversion: { value: 3.8, change: -0.4, benchmark: 4.2 },
  rfq: { value: 72, change: 15, responseTime: '3h 20m' },
  csat: { value: 4.6, reviews: 128 },
}

const CHART_DATA = [
  { label: 'Week 1', revenue: 520000, orders: 98 },
  { label: 'Week 2', revenue: 610000, orders: 110 },
  { label: 'Week 3', revenue: 590000, orders: 102 },
  { label: 'Week 4', revenue: 730000, orders: 118 },
]

const CATEGORY_DATA = [
  { name: 'Electronics', value: 45 },
  { name: 'Industrial', value: 25 },
  { name: 'Home & Kitchen', value: 18 },
  { name: 'Apparel', value: 12 },
]

const FUNNEL_DATA = [
  { stage: 'Placed', value: 520 },
  { stage: 'Confirmed', value: 468 },
  { stage: 'Shipped', value: 410 },
  { stage: 'Delivered', value: 382 },
]

const TOP_PRODUCTS = [
  {
    id: 'p1',
    name: 'Industrial Safety Gloves',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=300&auto=format&fit=crop',
    units: 1200,
    revenue: 144000,
    rating: 4.7,
    stock: 'Low',
  },
  {
    id: 'p2',
    name: 'HDPE Packaging Bags',
    image: 'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?q=80&w=300&auto=format&fit=crop',
    units: 3400,
    revenue: 61200,
    rating: 4.4,
    stock: 'In Stock',
  },
]

const GEO_DATA = [
  { city: 'Dhaka', orders: 180, revenue: 920000 },
  { city: 'Chittagong', orders: 98, revenue: 520000 },
  { city: 'Khulna', orders: 64, revenue: 310000 },
]

const CUSTOMER_DATA = [
  { label: 'New', value: 62 },
  { label: 'Returning', value: 38 },
]

const RFQ_ANALYTICS = [
  { label: 'RFQs received', value: '120' },
  { label: 'Response rate', value: '72%' },
  { label: 'Acceptance rate', value: '44%' },
  { label: 'Avg response time', value: '3h 20m' },
  { label: 'RFQ → Order', value: '18%' },
]

const TRAFFIC_DATA = [
  { label: 'Product page views', value: '18,240' },
  { label: 'Wishlist adds', value: '1,480' },
  { label: 'Search appearances', value: '32,900' },
  { label: 'CTR', value: '3.4%' },
]

const INVENTORY_DATA = [
  { label: 'Low stock alerts', value: '5' },
  { label: 'Out of stock', value: '2' },
  { label: 'Fast-moving', value: '6' },
  { label: 'Slow-moving', value: '4' },
  { label: 'Stock turnover', value: '4.8x' },
]

export function SellerAnalyticsPage() {
  const [range, setRange] = useState<Range>('30d')
  const [compare, setCompare] = useState(true)
  const [metricView, setMetricView] = useState<'revenue' | 'orders' | 'both'>('revenue')

  const chartData = useMemo(() => CHART_DATA, [])

  return (
    <SellerProtectedRoute requireVerified>
      <div className="space-y-8">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics & Insights</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track performance and spot growth opportunities.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as Range)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom</option>
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={compare}
                onChange={(event) => setCompare(event.target.checked)}
              />
              Compare with previous period
            </label>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <Download size={16} />
              Export Report
            </button>
          </div>
        </header>

        <section className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
          <KpiCard
            title="Total Revenue (GMV)"
            value={`৳${KPI_DATA.revenue.value.toLocaleString()}`}
            change={KPI_DATA.revenue.change}
            spark={KPI_DATA.revenue.spark}
            compare={compare}
          />
          <KpiCard
            title="Total Orders"
            value={`${KPI_DATA.orders.value}`}
            change={KPI_DATA.orders.change}
            subtitle={`Avg order: ৳${KPI_DATA.orders.aov.toLocaleString()}`}
            compare={compare}
          />
          <KpiCard
            title="Conversion Rate"
            value={`${KPI_DATA.conversion.value}%`}
            change={KPI_DATA.conversion.change}
            subtitle={`Benchmark: ${KPI_DATA.conversion.benchmark}%`}
            compare={compare}
          />
          <KpiCard
            title="RFQ Response Rate"
            value={`${KPI_DATA.rfq.value}%`}
            change={KPI_DATA.rfq.change}
            subtitle={`Avg response: ${KPI_DATA.rfq.responseTime}`}
            compare={compare}
          />
          <KpiCard
            title="Customer Satisfaction"
            value={`⭐ ${KPI_DATA.csat.value}`}
            subtitle={`${KPI_DATA.csat.reviews} reviews`}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Revenue Performance</h2>
              <p className="text-sm text-slate-500">Trend across {RANGE_LABELS[range]}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMetricView('revenue')}
                className={metricView === 'revenue' ? 'tab-active' : 'tab'}
              >
                Revenue
              </button>
              <button
                onClick={() => setMetricView('orders')}
                className={metricView === 'orders' ? 'tab-active' : 'tab'}
              >
                Orders
              </button>
              <button
                onClick={() => setMetricView('both')}
                className={metricView === 'both' ? 'tab-active' : 'tab'}
              >
                Both
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <Download size={16} />
                Export Chart
              </button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                {metricView !== 'orders' && (
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} />
                )}
                {metricView !== 'revenue' && (
                  <Line type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={3} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Sales by Category</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={CATEGORY_DATA} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                    {CATEGORY_DATA.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={['#f97316', '#2563eb', '#22c55e', '#f59e0b'][index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Order Status Funnel</h2>
            <div className="mt-4 space-y-3">
              {FUNNEL_DATA.map((step, index) => (
                <div key={step.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{step.stage}</span>
                    <span>{step.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-orange-500"
                      style={{ width: `${(step.value / FUNNEL_DATA[0].value) * 100}%` }}
                    />
                  </div>
                  {index < FUNNEL_DATA.length - 1 && (
                    <p className="text-xs text-slate-400">
                      Drop-off: {Math.round(((step.value - FUNNEL_DATA[index + 1].value) / step.value) * 100)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid xl:grid-cols-[1.4fr_1fr] gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Top Products</h2>
              <button className="text-sm font-semibold text-orange-600">View All Products</button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-400">
                  <tr>
                    <th className="pb-2">Product</th>
                    <th>Units sold</th>
                    <th>Revenue</th>
                    <th>Avg rating</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TOP_PRODUCTS.map((product) => (
                    <tr key={product.id}>
                      <td className="py-2">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                          <span className="font-semibold text-slate-800">{product.name}</span>
                        </div>
                      </td>
                      <td>{product.units}</td>
                      <td>৳{product.revenue.toLocaleString()}</td>
                      <td>{product.rating}</td>
                      <td>
                        <span className={product.stock === 'Low' ? 'text-orange-600' : 'text-green-600'}>
                          {product.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Geographic Insights</h2>
            <div className="grid gap-3">
              {GEO_DATA.map((city) => (
                <div key={city.city} className="flex items-center justify-between text-sm text-slate-600">
                  <span>{city.city}</span>
                  <span>{city.orders} orders · ৳{city.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              Map view coming soon · Identify growth opportunities by region.
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <InfoCard title="Customer Analytics" items={[
            { label: 'New vs Returning', value: '62% / 38%' },
            { label: 'Customer lifetime value', value: '৳48,200' },
            { label: 'Top buyers', value: 'Shahjalal Traders, Metro Retail' },
          ]} />
          <InfoCard title="RFQ Analytics" items={RFQ_ANALYTICS} />
          <InfoCard title="Traffic & Engagement" items={TRAFFIC_DATA} />
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <InfoCard title="Inventory Insights" items={INVENTORY_DATA} />
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-orange-600" />
              <h2 className="text-lg font-semibold text-slate-900">Insights & Recommendations</h2>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 list-disc pl-5">
              <li>Your response rate improved by 15% compared to last period.</li>
              <li>Top category: Electronics (45% of sales).</li>
              <li>Consider restocking: Industrial Safety Gloves (selling fast).</li>
              <li>Low stock alert: 5 products below threshold.</li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Reports & Exports</h2>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <Download size={16} />
              Export Report
            </button>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <button className="rounded-lg border border-slate-200 px-3 py-2">PDF</button>
            <button className="rounded-lg border border-slate-200 px-3 py-2">Excel</button>
            <button className="rounded-lg border border-slate-200 px-3 py-2">CSV</button>
            <button className="rounded-lg border border-slate-200 px-3 py-2">Email report</button>
            <button className="rounded-lg border border-slate-200 px-3 py-2">Schedule recurring</button>
          </div>
        </section>
      </div>
    </SellerProtectedRoute>
  )
}

function KpiCard({
  title,
  value,
  change,
  subtitle,
  spark,
  compare,
}: {
  title: string
  value: string
  change?: number
  subtitle?: string
  spark?: number[]
  compare?: boolean
}) {
  const trendUp = change !== undefined && change >= 0
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
      <p className="text-xs uppercase text-slate-400">{title}</p>
      <div className="flex items-center justify-between">
        <p className="text-xl font-semibold text-slate-900">{value}</p>
        {change !== undefined && (
          <span className={`text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
            {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      {compare && change !== undefined && (
        <p className="text-xs text-slate-400">vs previous period</p>
      )}
      {spark && (
        <div className="h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark.map((value, index) => ({ index, value }))}>
              <Area type="monotone" dataKey="value" stroke="#f97316" fill="#fde7d0" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function InfoCard({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span>{item.label}</span>
            <span className="font-semibold text-slate-800">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
