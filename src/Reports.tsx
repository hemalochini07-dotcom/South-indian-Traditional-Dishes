
import type { SalesOrder } from "./SalesTypes";

type ReportsProps = {
  orders: SalesOrder[];
};

const money = (value: number) =>
  "₹" + value.toLocaleString("en-IN");

function Reports({ orders }: ReportsProps) {
  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const totalPackets = orders.reduce(
    (sum, order) => sum + order.quantity,
    0
  );

  const delivered = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const pending = orders.filter(
    (order) =>
      order.status === "Pending" ||
      order.status === "Confirmed"
  ).length;

  const dispatched = orders.filter(
    (order) => order.status === "Dispatched"
  ).length;

  // Product-wise sales
  const productSales = orders.reduce<
    { name: string; revenue: number; quantity: number }[]
  >((result, order) => {
    const existing = result.find(
      (item) => item.name === order.product
    );

    if (existing) {
      existing.revenue += order.total;
      existing.quantity += order.quantity;
    } else {
      result.push({
        name: order.product,
        revenue: order.total,
        quantity: order.quantity,
      });
    }

    return result;
  }, []);

  const maxRevenue = Math.max(
    ...productSales.map((item) => item.revenue),
    1
  );

  // Daily sales heatmap - 28 days
  const latestDate = orders.reduce((latest, order) => {
    const parts = order.date.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date > latest ? date : latest;
  }, new Date());

  const heatmapEnd = new Date(
    latestDate.getFullYear(),
    latestDate.getMonth(),
    latestDate.getDate()
  );

  const dailySales = Array.from({ length: 28 }, (_, index) => {
    const date = new Date(heatmapEnd);
    date.setDate(date.getDate() - (27 - index));

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    const revenue = orders
      .filter((order) => order.date === key)
      .reduce((sum, order) => sum + order.total, 0);

    return { key, revenue };
  });

  const maxDailySales = Math.max(
    ...dailySales.map((day) => day.revenue),
    1
  );

  // Monthly revenue - six months
  const monthlySales = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      latestDate.getFullYear(),
      latestDate.getMonth() - (5 - index),
      1
    );

    const revenue = orders
      .filter((order) => {
        const parts = order.date.split("-").map(Number);
        return (
          parts[0] === date.getFullYear() &&
          parts[1] === date.getMonth() + 1
        );
      })
      .reduce((sum, order) => sum + order.total, 0);

    return {
      label: date.toLocaleDateString("en-IN", {
        month: "short",
      }),
      revenue,
    };
  });

  const maxMonthly = Math.max(
    ...monthlySales.map((item) => item.revenue),
    1
  );

  const linePoints = monthlySales
    .map((item, index) => {
      const x = 30 + index * 100;
      const y = 160 - (item.revenue / maxMonthly) * 125;
      return `${x},${y}`;
    })
    .join(" ");

  const totalStatus = orders.length || 1;

  const pendingPercent = (pending / totalStatus) * 100;
  const dispatchedPercent = (dispatched / totalStatus) * 100;
  

  const pieBackground = `conic-gradient(
    #f59e0b 0% ${pendingPercent}%,
    #3b82f6 ${pendingPercent}% ${pendingPercent + dispatchedPercent}%,
    #16a34a ${pendingPercent + dispatchedPercent}% 100%
  )`;

  return (
    <div className="products-page">
      <div className="products-heading">
        <span className="page-eyebrow">BUSINESS ANALYTICS</span>
        <h1>Business Reports</h1>
        <p>
          Analyze sales trends, product performance and business growth.
        </p>
      </div>

      {/* Summary cards */}
      <div className="product-summary">
        <div className="product-summary-card">
          <span>Total Orders</span>
          <h2>{orders.length}</h2>
        </div>

        <div className="product-summary-card">
          <span>Total Sales Revenue</span>
          <h2>{money(totalRevenue)}</h2>
        </div>

        <div className="product-summary-card">
          <span>Packets Sold</span>
          <h2>{totalPackets}</h2>
        </div>

        <div className="product-summary-card">
          <span>Delivered Orders</span>
          <h2>{delivered}</h2>
        </div>
      </div>

      {/* Daily sales heatmap */}
      <div className="product-table-card" style={{ marginTop: 24 }}>
        <h2>Daily Sales Heatmap</h2>
        <p style={{ color: "#64748b", marginBottom: 18 }}>
          Daily revenue activity over the last 28 days.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 9,
          }}
        >
          {dailySales.map((day) => {
            const intensity = day.revenue / maxDailySales;

            return (
              <div
                key={day.key}
                title={`${day.key} - ${money(day.revenue)}`}
                style={{
                  minHeight: 58,
                  borderRadius: 8,
                  background:
                    day.revenue === 0
                      ? "#e9eef5"
                      : `rgba(22, 163, 74, ${0.2 + intensity * 0.8})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  color: intensity > 0.55 ? "white" : "#334155",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <span>{Number(day.key.slice(-2))}</span>
                <span>{day.revenue > 0 ? money(day.revenue) : "—"}</span>
              </div>
            );
          })}
        </div>

        <p style={{ color: "#64748b", fontSize: 12, marginTop: 14 }}>
          Light: No or low sales | Dark: Higher sales
        </p>
      </div>

      {/* Product-wise bar chart */}
      <div className="product-table-card" style={{ marginTop: 24 }}>
        <h2>Product-wise Sales Bar Chart</h2>
        <p style={{ color: "#64748b" }}>
          Revenue generated by each product.
        </p>

        {productSales.length === 0 ? (
          <p>No product sales data available.</p>
        ) : (
          <div style={{ marginTop: 22 }}>
            {productSales.map((item) => (
              <div key={item.name} style={{ marginBottom: 22 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <strong>{item.name}</strong>
                  <span>
                    {money(item.revenue)} ({item.quantity} packets)
                  </span>
                </div>

                <div
                  style={{
                    height: 18,
                    background: "#e2e8f0",
                    borderRadius: 20,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(item.revenue / maxRevenue) * 100}%`,
                      background: "#2563eb",
                      borderRadius: 20,
                      minWidth: item.revenue > 0 ? 5 : 0,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly revenue graph */}
      <div className="product-table-card" style={{ marginTop: 24 }}>
        <h2>Monthly Revenue Trend</h2>
        <p style={{ color: "#64748b" }}>
          Revenue comparison across the last six months.
        </p>

        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg
            viewBox="0 0 560 205"
            style={{ width: "100%", minWidth: 320, marginTop: 18 }}
            role="img"
            aria-label="Monthly revenue line graph"
          >
            {[35, 75, 115, 155].map((y) => (
              <line
                key={y}
                x1="25"
                y1={y}
                x2="535"
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            ))}

            <polyline
              points={linePoints}
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {monthlySales.map((item, index) => {
              const x = 30 + index * 100;
              const y = 160 - (item.revenue / maxMonthly) * 125;

              return (
                <g key={item.label}>
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#2563eb"
                  />
                  <text
                    x={x}
                    y="187"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#475569"
                  >
                    {item.label}
                  </text>
                  <title>{`${item.label}: ${money(item.revenue)}`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Order status pie chart */}
      <div className="product-table-card" style={{ marginTop: 24 }}>
        <h2>Order Status Distribution</h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 35,
            flexWrap: "wrap",
            marginTop: 20,
          }}
        >
          <div
            style={{
              width: 175,
              height: 175,
              borderRadius: "50%",
              background:
                orders.length === 0
                  ? "#e2e8f0"
                  : pieBackground,
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                width: 95,
                height: 95,
                borderRadius: "50%",
                background: "white",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              {orders.length} Orders
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {[
              { label: "Pending / Confirmed", count: pending, color: "#f59e0b" },
              { label: "Dispatched", count: dispatched, color: "#3b82f6" },
              { label: "Delivered", count: delivered, color: "#16a34a" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: 3,
                    background: item.color,
                  }}
                />
                <span>{item.label}: {item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
