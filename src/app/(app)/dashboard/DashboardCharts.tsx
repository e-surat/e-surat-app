"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export type YearPoint = { year: string; masuk: number; keluar: number };
export type PieYear = { year: string; masuk: number; keluar: number };

const MASUK = "#6366f1";
const KELUAR = "#10b981";

export default function DashboardCharts({
  perYear,
  pies,
}: {
  perYear: YearPoint[];
  pies: PieYear[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Tren Surat per Tahun
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={perYear} margin={{ left: -16, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="masuk"
              name="Surat Masuk"
              stroke={MASUK}
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="keluar"
              name="Surat Keluar"
              stroke={KELUAR}
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Histogram Jumlah Surat per Tahun
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={perYear} margin={{ left: -16, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="masuk" name="Surat Masuk" fill={MASUK} radius={[4, 4, 0, 0]} />
            <Bar dataKey="keluar" name="Surat Keluar" fill={KELUAR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Proporsi Masuk vs Keluar per Tahun
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {pies.map((p) => {
            const data = [
              { name: "Masuk", value: p.masuk },
              { name: "Keluar", value: p.keluar },
            ];
            const total = p.masuk + p.keluar;
            return (
              <div key={p.year} className="text-center">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={32}
                      outerRadius={55}
                      paddingAngle={2}
                    >
                      <Cell fill={MASUK} />
                      <Cell fill={KELUAR} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-sm font-semibold text-slate-900">{p.year}</p>
                <p className="text-xs text-slate-500">{total} surat</p>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm" style={{ background: MASUK }} />
            Masuk
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm" style={{ background: KELUAR }} />
            Keluar
          </span>
        </div>
      </div>
    </div>
  );
}
