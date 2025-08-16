import React from "react";
import PropTypes from "prop-types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const SalesByHourChart = ({ data }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
          <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            formatter={(v) => ["₱" + v.toLocaleString(), "Sales"]}
          />
          <Bar dataKey="sales" radius={[4, 4, 0, 0]} fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

SalesByHourChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({ hour: PropTypes.string, sales: PropTypes.number })
  ).isRequired,
};

export default SalesByHourChart;
