
import type { SalesOrder } from "./SalesTypes";

type SalesReportsProps = {
  orders: SalesOrder[];
};

function SalesReports({ orders }: SalesReportsProps) {
  const totalOrders = orders.length;

  const totalSales = orders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const pendingOrders = orders.filter(
    (order) =>
      order.status === "Pending" ||
      order.status === "Confirmed"
  ).length;

  const dispatchedOrders = orders.filter(
    (order) => order.status === "Dispatched"
  ).length;

  const productSales = orders.reduce<
    { product: string; quantity: number; revenue: number }[]
  >((summary, order) => {
    const existing = summary.find(
      (item) => item.product === order.product
    );

    if (existing) {
      existing.quantity += order.quantity;
      existing.revenue += order.total;
    } else {
      summary.push({
        product: order.product,
        quantity: order.quantity,
        revenue: order.total,
      });
    }

    return summary;
  }, []);

  const statusData = [
    { name: "Pending / Confirmed", count: pendingOrders },
    { name: "Dispatched", count: dispatchedOrders },
    { name: "Delivered", count: deliveredOrders },
  ];

  return (
    <div className="products-page">
      <div className="products-heading">
        <span className="page-eyebrow">BUSINESS ANALYTICS</span>
        <h1>Sales Reports</h1>
        <p>Monitor sales performance and customer orders.</p>
      </div>

      <div className="product-summary">
        <div className="product-summary-card">
          <span>Total Orders</span>
          <h2>{totalOrders}</h2>
        </div>

        <div className="product-summary-card">
          <span>Total Sales Revenue</span>
          <h2>₹{totalSales.toLocaleString("en-IN")}</h2>
        </div>

        <div className="product-summary-card">
          <span>Delivered Orders</span>
          <h2>{deliveredOrders}</h2>
        </div>

        <div className="product-summary-card">
          <span>Pending Orders</span>
          <h2>{pendingOrders}</h2>
        </div>
      </div>

      <div className="product-table-card">
        <h2>Order Status Summary</h2>

        <div className="product-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>Order Status</th>
                <th>Number of Orders</th>
              </tr>
            </thead>
            <tbody>
              {statusData.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="product-table-card">
        <h2>Product-wise Sales Summary</h2>

        <div className="product-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity Ordered</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {productSales.length === 0 ? (
                <tr>
                  <td colSpan={3}>No sales data available.</td>
                </tr>
              ) : (
                productSales.map((item) => (
                  <tr key={item.product}>
                    <td>{item.product}</td>
                    <td>{item.quantity} packets</td>
                    <td>
                      ₹{item.revenue.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="product-table-card">
        <h2>Recent Sales Orders</h2>

        <div className="product-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5}>No orders available.</td>
                </tr>
              ) : (
                [...orders]
                  .sort((a, b) => b.id - a.id)
                  .map((order) => (
                    <tr key={order.id}>
                      <td>{order.orderNo}</td>
                      <td>{order.customer}</td>
                      <td>{order.date}</td>
                      <td>
                        ₹{order.total.toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span className="product-status">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalesReports;
