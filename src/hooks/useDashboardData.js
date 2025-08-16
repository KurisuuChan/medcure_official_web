import { useMemo } from "react";
import { subHours, format } from "date-fns";

// Mock dashboard data. Replace with real API or Supabase queries later.
export function useDashboardData() {
  // Compute sales by hour based on current time when hook first runs
  const salesByHourData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }).map((_, idx) => {
      const date = subHours(now, 11 - idx);
      return {
        hour: format(date, "HH:00"),
        sales: Math.round(Math.random() * 1200 + 100),
      };
    });
  }, []);

  const salesByCategory = useMemo(
    () => [
      { category: "Antibiotics", value: 4200 },
      { category: "Vitamins", value: 3100 },
      { category: "Pain Relief", value: 2800 },
      { category: "OTC", value: 1900 },
    ],
    []
  );

  const bestSellers = useMemo(
    () => [
      { name: "Amoxicillin 500mg", quantity: 134 },
      { name: "Vitamin C 1000mg", quantity: 118 },
      { name: "Paracetamol 500mg", quantity: 102 },
      { name: "Ibuprofen 200mg", quantity: 87 },
    ],
    []
  );

  const expiringSoon = useMemo(
    () => [
      { name: "Cough Syrup 60ml", days: 18 },
      { name: "Antacid Tabs", days: 25 },
      { name: "Vitamin D3", days: 33 },
    ],
    []
  );

  const lowStockItems = useMemo(
    () => [
      { name: "Bandage Roll", quantity: 6 },
      { name: "Zinc Supplement", quantity: 4 },
      { name: "Allergy Relief", quantity: 2 },
    ],
    []
  );

  const recentSales = useMemo(
    () => [
      { id: 1, product: "Vitamin C 1000mg", qty: 3, price: 399, time: "Just now" },
      { id: 2, product: "Paracetamol 500mg", qty: 2, price: 120, time: "5m ago" },
      { id: 3, product: "Amoxicillin 500mg", qty: 1, price: 560, time: "12m ago" },
      { id: 4, product: "Ibuprofen 200mg", qty: 4, price: 320, time: "25m ago" },
    ],
    []
  );

  const summaryCards = useMemo(
    () => [
      {
        title: "Total Products",
        value: 148,
        iconBg: "bg-blue-50 text-blue-600",
      },
      {
        title: "Low Stock",
        value: lowStockItems.length,
        iconBg: "bg-amber-50 text-amber-600",
      },
      {
        title: "Expiring Soon",
        value: expiringSoon.length,
        iconBg: "bg-red-50 text-red-600",
      },
      {
        title: "Today Sales",
        value: "₱" + salesByHourData.reduce((a, b) => a + b.sales, 0).toLocaleString(),
        iconBg: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "Avg / Hour",
        value: "₱" + Math.round(salesByHourData.reduce((a, b) => a + b.sales, 0) / salesByHourData.length).toLocaleString(),
        iconBg: "bg-indigo-50 text-indigo-600",
      },
      {
        title: "Best Seller Qty",
        value: bestSellers[0].quantity,
        iconBg: "bg-fuchsia-50 text-fuchsia-600",
      },
    ],
    [lowStockItems.length, expiringSoon.length, salesByHourData, bestSellers]
  );

  return {
    loading: false,
    error: null,
    summaryCards,
    salesByHourData,
    salesByCategory,
    bestSellers,
    expiringSoon,
    lowStockItems,
    recentSales,
  };
}

export default useDashboardData;
