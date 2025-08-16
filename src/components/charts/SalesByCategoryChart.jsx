import React from "react";
import PropTypes from "prop-types";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#6366f1", "#ec4899"];

const SalesByCategoryChart = ({ data }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={86}
            innerRadius={48}
            paddingAngle={2}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => ["₱" + v.toLocaleString(), "Sales"]} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

SalesByCategoryChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({ category: PropTypes.string, value: PropTypes.number })
  ).isRequired,
};

export default SalesByCategoryChart;
