"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const departmentColors = ["#0B1F3A", "#2563EB", "#60A5FA", "#0EA5E9", "#94A3B8"];

export function AttendanceChart({ data }) {
  return (
    <div className="h-[220px] w-full" aria-label="Seven-day attendance chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "#F5F8FD" }}
            contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
          />
          <Bar dataKey="present" name="Present / Late" fill="#2563EB" radius={[7, 7, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepartmentChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="relative h-[220px] w-full" aria-label="Department headcount chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={82}
            paddingAngle={1}
            stroke="none"
          >
            {data.map((item, index) => (
              <Cell key={item.name} fill={departmentColors[index % departmentColors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[24px] font-bold leading-none text-[#10264A]">{total}</span>
        <span className="mt-1 text-[11px] font-medium text-[#64748B]">Total Staff</span>
      </div>
    </div>
  );
}
