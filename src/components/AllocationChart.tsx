import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface AllocationChartProps {
  data: { name: string; value: number; percentage: number }[];
}

const COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f43f5e"  // Rose
];

export function AllocationChart({ data }: AllocationChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 font-sans">
        No holding allocations yet. Purchase assets to view split.
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => [`$${value.toLocaleString()}`, "Allocation"]}
            contentStyle={{ 
              backgroundColor: "rgba(30, 41, 59, 0.95)", 
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px"
            }} 
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconSize={10} 
            iconType="circle"
            formatter={(value, entry: any) => {
              const item = data.find((d) => d.name === value);
              return (
                <span className="text-xs text-gray-700 dark:text-gray-300 font-sans ml-1">
                  {value} ({item ? `${item.percentage}%` : ""})
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
