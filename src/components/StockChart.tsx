import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface StockChartProps {
  data: { date: string; price: number; volume: number }[];
  isPositive: boolean;
}

export function StockChart({ data, isPositive }: StockChartProps) {
  const strokeColor = isPositive ? "#10b981" : "#f43f5e"; // Emerald vs Rose
  const fillColor = isPositive ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)";
  const gradientId = `colorPrice-${isPositive ? "pos" : "neg"}`;

  // Find min and max for y-axis padding
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const yPadding = (maxPrice - minPrice) * 0.1 || 1;

  return (
    <div className="w-full h-72 md:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.15)" />
          <XAxis 
            dataKey="date" 
            stroke="rgba(128, 128, 128, 0.6)" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={[Number((minPrice - yPadding).toFixed(2)), Number((maxPrice + yPadding).toFixed(2))]}
            stroke="rgba(128, 128, 128, 0.6)" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "rgba(30, 41, 59, 0.9)", 
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff"
            }} 
            labelStyle={{ fontWeight: "bold", color: "#94a3b8" }}
            formatter={(value: any) => [`$${value}`, "Price"]}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={strokeColor} 
            strokeWidth={2}
            fillOpacity={1} 
            fill={`url(#${gradientId})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
