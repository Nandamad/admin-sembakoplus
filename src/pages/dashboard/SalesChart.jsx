import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './SalesChart.css'

const sales = []

function SalesChart() {
  return (
    <section className="dashboard__panel sales-chart">
      <div className="dashboard__panel-header">
        <h2 className="dashboard__panel-title">
          Tren Penjualan Sembako Mingguan (7 Hari Terakhir)
        </h2>
      </div>
      <div className="sales-chart__plot">
        {sales.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sales} margin={{ top: 18, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid
                vertical={false}
                stroke="#edf0e9"
                strokeDasharray="3 4"
              />
              <XAxis
                axisLine={false}
                dataKey="day"
                tick={{ fill: '#71806a', fontSize: 10, fontWeight: 600 }}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  border: '1px solid #e5e9dd',
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value) => [
                  `Rp ${Number(value).toLocaleString('id-ID')}`,
                  'Penjualan',
                ]}
                labelStyle={{ color: '#30402a', fontWeight: 700 }}
              />
              <Bar dataKey="value" maxBarSize={38} radius={[5, 5, 0, 0]}>
                <LabelList
                  dataKey="short"
                  position="top"
                  fill="#8a9681"
                  fontSize={9}
                />
                {sales.map((item) => (
                  <Cell fill="#c8ddba" key={item.day} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="sales-chart__empty">
            Data penjualan belum tersedia dari backend.
          </p>
        )}
      </div>
    </section>
  )
}

export default SalesChart
