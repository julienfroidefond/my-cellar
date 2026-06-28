"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLOR_CFG: Record<string, { color: string; label: string }> = {
  rouge: { color: "#c0193b", label: "Rouge" },
  blanc: { color: "#b87a2c", label: "Blanc" },
  rosé:  { color: "#d4647a", label: "Rosé" },
};

const CARD_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  boxShadow: "0 2px 12px rgba(26,10,14,0.06)",
};

const TOOLTIP_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "6px 12px",
  fontSize: 13,
  fontFamily: "var(--font-inter)",
  color: "var(--foreground)",
  boxShadow: "0 4px 16px rgba(26,10,14,0.10)",
};

interface Props {
  byColor: Record<string, number>;
  byMonth: Array<{ month: string; value: number }>;
  ratingDist: Array<{ label: string; value: number }>;
  hasRatings: boolean;
  topAppellations: Array<{ name: string; value: number }>;
}

export default function HistoryCharts({ byColor, byMonth, ratingDist, hasRatings, topAppellations }: Props) {
  const colorData = Object.entries(byColor).map(([key, value]) => ({
    name: COLOR_CFG[key]?.label ?? key,
    value,
    color: COLOR_CFG[key]?.color ?? "#888",
  }));

  return (
    <div className="space-y-6">
      {/* Row 1: color donut + monthly activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Donut — couleurs bues */}
        <div className="rounded-2xl p-6" style={CARD_STYLE}>
          <p
            className="text-xs tracking-[0.3em] uppercase mb-1"
            style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 600 }}
          >
            Dégustation
          </p>
          <h3
            className="text-xl font-semibold mb-6"
            style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
          >
            Par couleur
          </h3>

          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={colorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {colorData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={TOOLTIP_STYLE}>
                        <span style={{ color: d.color, fontWeight: 600 }}>{d.name}</span>
                        {" — "}
                        {d.value} bouteille{d.value > 1 ? "s" : ""}
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3 flex-1">
              {colorData.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span
                    className="text-sm flex-1"
                    style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}
                  >
                    {d.name}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ fontFamily: "var(--font-playfair)", color: d.color }}
                  >
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar chart — activité mensuelle */}
        <div className="rounded-2xl p-6" style={CARD_STYLE}>
          <p
            className="text-xs tracking-[0.3em] uppercase mb-1"
            style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 600 }}
          >
            Activité
          </p>
          <h3
            className="text-xl font-semibold mb-6"
            style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
          >
            Par mois
          </h3>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={byMonth}
              margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid vertical={false} stroke="rgba(26,10,14,0.06)" />
              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 10,
                  fontFamily: "var(--font-inter)",
                  fill: "rgba(26,10,14,0.45)",
                  angle: -35,
                  textAnchor: "end",
                }}
                axisLine={false}
                tickLine={false}
                height={52}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fontFamily: "var(--font-inter)", fill: "rgba(26,10,14,0.35)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(192,25,59,0.04)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0];
                  return (
                    <div style={TOOLTIP_STYLE}>
                      <span style={{ color: "var(--wine-red)", fontWeight: 600 }}>{d.payload.month}</span>
                      {" — "}
                      {d.value} bouteille{(d.value as number) > 1 ? "s" : ""}
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" fill="#c0193b" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: appellations + rating distribution */}
      {(topAppellations.length > 0 || hasRatings) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Horizontal bar — top appellations */}
          {topAppellations.length > 0 && (
            <div className="rounded-2xl p-6" style={CARD_STYLE}>
              <p
                className="text-xs tracking-[0.3em] uppercase mb-1"
                style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 600 }}
              >
                Géographie
              </p>
              <h3
                className="text-xl font-semibold mb-6"
                style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
              >
                Top appellations
              </h3>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={topAppellations}
                  layout="vertical"
                  margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid horizontal={false} stroke="rgba(26,10,14,0.06)" />
                  <XAxis
                    type="number"
                    domain={[0, topAppellations[0]?.value ?? 1]}
                    tick={{ fontSize: 11, fontFamily: "var(--font-inter)", fill: "rgba(26,10,14,0.35)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 11, fontFamily: "var(--font-inter)", fill: "rgba(26,10,14,0.65)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(192,25,59,0.04)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div style={TOOLTIP_STYLE}>
                          <span style={{ color: "var(--wine-red)", fontWeight: 600 }}>{d.payload.name}</span>
                          {" — "}
                          {d.value} bouteille{(d.value as number) > 1 ? "s" : ""}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" fill="#c0193b" radius={[0, 4, 4, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bar chart — rating distribution */}
          {hasRatings && (
            <div className="rounded-2xl p-6" style={CARD_STYLE}>
              <p
                className="text-xs tracking-[0.3em] uppercase mb-1"
                style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 600 }}
              >
                Notes
              </p>
              <h3
                className="text-xl font-semibold mb-6"
                style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
              >
                Distribution
              </h3>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={ratingDist}
                  margin={{ top: 0, right: 8, left: -24, bottom: 0 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid vertical={false} stroke="rgba(26,10,14,0.06)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fontFamily: "var(--font-inter)", fill: "rgba(26,10,14,0.55)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fontFamily: "var(--font-inter)", fill: "rgba(26,10,14,0.35)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(184,122,44,0.06)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div style={TOOLTIP_STYLE}>
                          <span style={{ color: "#b87a2c", fontWeight: 600 }}>{d.payload.label}</span>
                          {" — "}
                          {d.value} vin{(d.value as number) > 1 ? "s" : ""}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" fill="#b87a2c" radius={[3, 3, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
