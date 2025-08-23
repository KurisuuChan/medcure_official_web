import React, { useState, useEffect } from "react";
import { debugTodaySales, getSalesSummary } from "../services/salesService";

/**
 * Debug Component to test today's sales fixes
 * Add this to your app temporarily to test the fixes
 */
const TodaysSalesDebug = () => {
  const [debugResult, setDebugResult] = useState(null);
  const [summaryResult, setSummaryResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    try {
      console.log("🚀 Running today's sales debug...");
      const result = await debugTodaySales();
      setDebugResult(result);

      console.log("📊 Getting sales summary...");
      const summary = await getSalesSummary("today");
      setSummaryResult(summary);

      console.log("✅ Debug complete!");
    } catch (error) {
      console.error("❌ Debug failed:", error);
      setDebugResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run on component mount
    runDebug();
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        margin: "20px",
        border: "2px solid #007bff",
        borderRadius: "8px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h3>🔧 Today's Sales Debug Panel</h3>

      <button
        onClick={runDebug}
        disabled={loading}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "⏳ Running..." : "🔄 Run Debug Test"}
      </button>

      {summaryResult && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#e7f3ff",
            borderRadius: "4px",
          }}
        >
          <h4>📊 Sales Summary Result:</h4>
          <div style={{ fontFamily: "monospace" }}>
            <div>
              <strong>Total Revenue:</strong> $
              {summaryResult.totalRevenue?.toFixed(2) || "0.00"}
            </div>
            <div>
              <strong>Total Transactions:</strong>{" "}
              {summaryResult.totalTransactions || 0}
            </div>
            <div>
              <strong>Average Transaction:</strong> $
              {summaryResult.averageTransaction?.toFixed(2) || "0.00"}
            </div>
            <div>
              <strong>Total Items Sold:</strong>{" "}
              {summaryResult.totalItemsSold || 0}
            </div>
            <div>
              <strong>Period:</strong> {summaryResult.period}
            </div>
            {summaryResult.dateRange && (
              <div>
                <strong>Date Range:</strong>
                <br />
                Start: {summaryResult.dateRange.startLocal}
                <br />
                End: {summaryResult.dateRange.endLocal}
              </div>
            )}
          </div>
        </div>
      )}

      {debugResult && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#f0f8ff",
            borderRadius: "4px",
          }}
        >
          <h4>🔍 Debug Details:</h4>
          {debugResult.error ? (
            <div style={{ color: "red" }}>
              <strong>Error:</strong> {debugResult.error}
            </div>
          ) : (
            <div style={{ fontFamily: "monospace", fontSize: "12px" }}>
              <div>
                <strong>Raw Sales Count:</strong>{" "}
                {debugResult.sales?.length || 0}
              </div>
              <div>
                <strong>Raw Total:</strong> $
                {debugResult.total?.toFixed(2) || "0.00"}
              </div>
              {debugResult.sales && debugResult.sales.length > 0 && (
                <details style={{ marginTop: "10px" }}>
                  <summary>Sample Sales Data</summary>
                  <pre
                    style={{
                      fontSize: "10px",
                      overflow: "auto",
                      maxHeight: "200px",
                    }}
                  >
                    {JSON.stringify(debugResult.sales.slice(0, 3), null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#fff3cd",
          borderRadius: "4px",
        }}
      >
        <h5>📝 Instructions:</h5>
        <ol style={{ margin: 0, paddingLeft: "20px" }}>
          <li>
            First run the SQL script: <code>fix_today_sales_data.sql</code>
          </li>
          <li>Check the console for detailed debug logs</li>
          <li>Compare the results above with your dashboard</li>
          <li>If values don't match, check browser timezone settings</li>
        </ol>
      </div>
    </div>
  );
};

export default TodaysSalesDebug;
