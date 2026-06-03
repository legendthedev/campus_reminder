import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export function PunctualityTrendChart({ data }) {
  if (!data || !data.length) return <EmptyChart label="No trend data yet" />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tickFormatter={w => `Wk ${w}`} tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => v.toFixed(2)} labelFormatter={w => `Week ${w}`} />
        <Legend />
        <Line type="monotone" dataKey="avg_punctuality" stroke="#1565C0" strokeWidth={2}
          name="Avg punctuality (1–5)" dot={{ r: 4 }} />
        <Line type="monotone" dataKey="avg_missed" stroke="#E53935" strokeWidth={2}
          name="Avg missed classes" dot={{ r: 4 }} strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ReminderSplitChart({ data }) {
  if (!data || !data.length) return <EmptyChart label="No reminder data yet" />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tickFormatter={w => `Wk ${w}`} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip labelFormatter={w => `Week ${w}`} />
        <Legend />
        <Bar dataKey="on_campus" stackId="a" fill="#43A047" name="On campus" />
        <Bar dataKey="off_campus" stackId="a" fill="#FB8C00" name="Off campus" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Q1DistributionChart({ responses }) {
  if (!responses || !responses.length) return <EmptyChart label="No responses" />;
  const counts = [1,2,3,4,5].map(r => ({
    rating: `★ ${r}`,
    count: responses.filter(s => s.q1_punctuality_rating === r).length,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={counts} layout="vertical" margin={{ top: 4, right: 24, left: 16, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="rating" tick={{ fontSize: 12 }} width={40} />
        <Tooltip />
        <Bar dataKey="count" fill="#1565C0" radius={[0,4,4,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Q3PieChart({ responses }) {
  if (!responses || !responses.length) return <EmptyChart label="No responses" />;
  const yes = responses.filter(r => r.q3_reminder_helpful).length;
  const no = responses.length - yes;
  const data = [{ name: 'Helpful', value: yes }, { name: 'Not helpful', value: no }];
  const COLORS = ['#43A047', '#E53935'];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function Q4PreferenceChart({ responses }) {
  if (!responses || !responses.length) return <EmptyChart label="No responses" />;
  const opts = ['on_campus_only','always','never'];
  const labels = { on_campus_only: 'On campus only', always: 'Always', never: 'Never' };
  const data = opts.map(o => ({ name: labels[o], count: responses.filter(r => r.q4_location_preference === o).length }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#7B1FA2" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Q5ComfortChart({ responses }) {
  if (!responses || !responses.length) return <EmptyChart label="No responses" />;
  const counts = [1,2,3,4,5].map(r => ({
    rating: `${r}`, count: responses.filter(s => s.q5_privacy_comfort === r).length,
  }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={counts} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
        <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#00897B" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PlatformDonutChart({ data }) {
  if (!data) return <EmptyChart label="No data" />;
  const chartData = [
    { name: 'Android', value: data.android || 0 },
    { name: 'iOS', value: data.ios || 0 },
    { name: 'Unknown', value: data.unknown || 0 },
  ].filter(d => d.value > 0);
  const COLORS = ['#43A047', '#1565C0', '#9E9E9E'];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
          dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ label }) {
  return (
    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#bbb', fontSize: 14, border: '1px dashed #e0e0e0', borderRadius: 8 }}>
      {label}
    </div>
  );
}
