
import { useEffect, useState, type FormEvent } from "react";
import type { FinishedProduct } from "./FinishedGoods";
import type { SalesOrder } from "./SalesTypes";
import { apiGet, apiPost, apiPut } from "./api";

type UserRole = "Admin" | "Staff";

type SalesOrdersProps = {
  role: UserRole;
  products: FinishedProduct[];
  onProductsUpdate: (products: FinishedProduct[]) => void;
  orders: SalesOrder[];
  onOrdersUpdate: (orders: SalesOrder[]) => void;
};

type BackendCustomer = {
  id: number;
  name: string;
};

type BackendProduct = {
  id: number;
  name: string;
  price: number | string;
};

type BackendFinishedProduct = {
  id: number;
  name: string;
  category: string;
  quantity: number | string;
  unit: string;
  minimum_stock: number | string;
};

type BackendSalesOrder = {
  id: number;
  order_no: string;
  customer: string;
  product: string;
  quantity: number | string;
  price: number | string;
  total: number | string;
  date: string;
  status: SalesOrder["status"];
};

function mapOrder(item: BackendSalesOrder): SalesOrder {
  return {
    id: item.id,
    orderNo: item.order_no,
    customer: item.customer,
    product: item.product,
    quantity: Number(item.quantity),
    price: Number(item.price),
    total: Number(item.total),
    date: item.date,
    status: item.status,
  };
}

function mapFinishedProduct(
  item: BackendFinishedProduct
): FinishedProduct {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: Number(item.quantity),
    unit: item.unit,
    minimumStock: Number(item.minimum_stock),
  };
}

function SalesOrders({
  role,
  products,
  onProductsUpdate,
  orders,
  onOrdersUpdate,
}: SalesOrdersProps) {
  const [customers, setCustomers] = useState<string[]>([]);
  const [productPrices, setProductPrices] = useState<
    Record<string, number>
  >({});

  const [customer, setCustomer] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadSalesData() {
    try {
      setLoading(true);
      setError("");

      const [orderData, customerData, productData] =
        await Promise.all([
          apiGet<BackendSalesOrder[]>("/sales-orders"),
          apiGet<BackendCustomer[]>("/customers"),
          apiGet<BackendProduct[]>("/products"),
        ]);

      onOrdersUpdate(orderData.map(mapOrder));

      const customerNames = customerData.map(
        (item) => item.name
      );

      setCustomers(customerNames);

      if (customerNames.length > 0) {
        setCustomer((current) =>
          customerNames.includes(current)
            ? current
            : customerNames[0]
        );
      }

      const prices: Record<string, number> = {};

      productData.forEach((item) => {
        prices[item.name] = Number(item.price);
      });

      setProductPrices(prices);

      setProduct((current) =>
        products.some((item) => item.name === current)
          ? current
          : products[0]?.name || ""
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load sales data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSalesData();
  }, []);

  useEffect(() => {
    if (
      products.length > 0 &&
      !products.some((item) => item.name === product)
    ) {
      setProduct(products[0].name);
    }
  }, [products, product]);

  const selectedProduct = products.find(
    (item) => item.name === product
  );

  const price = productPrices[product] ?? 0;
  const amount = Number(quantity);
  const total = amount * price;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!customer || !selectedProduct) {
      alert("Select a valid customer and product.");
      return;
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      alert("Enter a valid whole-number quantity.");
      return;
    }

    if (amount > 10000) {
      alert("Order quantity cannot exceed 10,000 packets.");
      return;
    }

    if (price <= 0 || !Number.isFinite(total)) {
      alert("Invalid product price or order amount.");
      return;
    }

    if (selectedProduct.quantity < amount) {
      alert("Insufficient finished goods stock.");
      return;
    }

    const nextNumber =
      orders.reduce((max, order) => {
        const number = Number(order.orderNo.split("-")[1]);
        return Number.isFinite(number)
          ? Math.max(max, number)
          : max;
      }, 0) + 1;

    const newOrderNumber = `SO-${String(nextNumber).padStart(3, "0")}`;

    try {
      setSaving(true);
      setError("");

      const savedOrder = await apiPost<BackendSalesOrder>(
        "/sales-orders",
        {
          order_no: newOrderNumber,
          customer,
          product,
          quantity: amount,
          price,
          date: new Date().toISOString().slice(0, 10),
          status: "Pending",
        }
      );

      onOrdersUpdate([mapOrder(savedOrder), ...orders]);
      setQuantity("1");

      alert("Sales order created successfully!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create sales order."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (
    orderId: number,
    newStatus: SalesOrder["status"]
  ) => {
    if (role !== "Admin") {
      alert("Only Admin can update order status.");
      return;
    }

    const order = orders.find((item) => item.id === orderId);

    if (!order) return;

    if (newStatus === "Confirmed" && order.status !== "Pending") {
      alert("Only pending orders can be confirmed.");
      return;
    }

    if (newStatus === "Dispatched" && order.status !== "Confirmed") {
      alert("Confirm the order before dispatching.");
      return;
    }

    if (newStatus === "Delivered" && order.status !== "Dispatched") {
      alert("Only dispatched orders can be marked as delivered.");
      return;
    }

    if (newStatus === "Dispatched") {
      const finishedProduct = products.find(
        (item) => item.name === order.product
      );

      if (!finishedProduct) {
        alert("Product not found in finished goods inventory.");
        return;
      }

      if (finishedProduct.quantity < order.quantity) {
        alert("Insufficient finished goods stock.");
        return;
      }
    }

    try {
      setUpdatingId(orderId);
      setError("");

      const updatedOrder = await apiPut<BackendSalesOrder>(
        `/sales-orders/${orderId}`,
        { status: newStatus }
      );

      onOrdersUpdate(
        orders.map((item) =>
          item.id === orderId ? mapOrder(updatedOrder) : item
        )
      );

      // Backend deducts stock during dispatch.
      // Refresh inventory instead of deducting locally again.
      if (newStatus === "Dispatched") {
        const stockData = await apiGet<BackendFinishedProduct[]>(
          "/finished-goods"
        );

        onProductsUpdate(stockData.map(mapFinishedProduct));
      }

      alert(`Order status updated to ${newStatus}.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const exportSalesOrders = () => {
    if (orders.length === 0) {
      alert("No sales orders available to export.");
      return;
    }

    const headers = [
      "Order Number",
      "Customer",
      "Product",
      "Quantity",
      "Unit Price",
      "Total Amount",
      "Date",
      "Status",
    ];

    const rows = orders.map((order) => [
      order.orderNo,
      order.customer,
      order.product,
      order.quantity,
      order.price,
      order.total,
      order.date,
      order.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(
      ["\uFEFF", csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Sales_Orders_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.toLowerCase().includes(search.toLowerCase()) ||
      order.product.toLowerCase().includes(search.toLowerCase())
  );

  const totalSales = orders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  return (
    <div className="products-page">
      <div className="products-heading">
        <span className="page-eyebrow">SALES MANAGEMENT</span>
        <h1>Sales Order Management</h1>
        <p>Create customer orders and manage dispatch status.</p>
      </div>

      <div className="product-summary">
        <div className="product-summary-card">
          <span>Total Orders</span>
          <h2>{orders.length}</h2>
        </div>

        <div className="product-summary-card">
          <span>Total Sales Value</span>
          <h2>₹{totalSales.toLocaleString("en-IN")}</h2>
        </div>

        <div className="product-summary-card">
          <span>Pending Orders</span>
          <h2>{pendingOrders}</h2>
        </div>

        <div className="product-summary-card">
          <span>Delivered Orders</span>
          <h2>{deliveredOrders}</h2>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="product-form-card">
        <h2>Create Sales Order</h2>

        <form onSubmit={handleSubmit}>
          <div className="product-form-grid">
            <label>
              Customer
              <select
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                required
              >
                <option value="">Select Customer</option>
                {customers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Product
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                required
              >
                <option value="">Select Product</option>
                {products.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Quantity (Packets)
              <input
                type="number"
                min="1"
                max="10000"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </label>

            <label>
              Unit Price
              <input value={`₹${price}`} readOnly />
            </label>

            <label>
              Total Amount
              <input
                value={`₹${Number.isFinite(total) ? total : 0}`}
                readOnly
              />
            </label>

            <label>
              Available Stock
              <input
                value={`${selectedProduct?.quantity ?? 0} packets`}
                readOnly
              />
            </label>
          </div>

          <div className="product-form-actions">
            <button
              className="add-product-button"
              type="submit"
              disabled={saving || loading}
            >
              {saving ? "Saving..." : "Create Sales Order"}
            </button>
          </div>
        </form>
      </div>

      <div className="product-table-card">
        <div className="product-table-heading">
          <h2>Sales Order History</h2>

          <input
            className="product-search"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {role === "Admin" && (
            <button
              className="add-product-button"
              type="button"
              onClick={exportSalesOrders}
            >
              Export CSV
            </button>
          )}
        </div>

        <div className="product-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>Order No.</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Date</th>
                <th>Status</th>
                {role === "Admin" && <th>Update Status</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={role === "Admin" ? 8 : 7}>
                    Loading sales orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={role === "Admin" ? 8 : 7}>
                    No sales orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNo}</td>
                    <td>{order.customer}</td>
                    <td>{order.product}</td>
                    <td>{order.quantity}</td>
                    <td>₹{order.total.toLocaleString("en-IN")}</td>
                    <td>{order.date}</td>
                    <td>
                      <span className="product-status">
                        {order.status}
                      </span>
                    </td>

                    {role === "Admin" && (
                      <td>
                        {order.status === "Pending" ? (
                          <button
                            className="add-product-button"
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() =>
                              updateStatus(order.id, "Confirmed")
                            }
                          >
                            {updatingId === order.id ? "Saving..." : "Confirm"}
                          </button>
                        ) : order.status === "Confirmed" ? (
                          <button
                            className="add-product-button"
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() =>
                              updateStatus(order.id, "Dispatched")
                            }
                          >
                            {updatingId === order.id ? "Saving..." : "Dispatch"}
                          </button>
                        ) : order.status === "Dispatched" ? (
                          <button
                            className="add-product-button"
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() =>
                              updateStatus(order.id, "Delivered")
                            }
                          >
                            {updatingId === order.id ? "Saving..." : "Deliver"}
                          </button>
                        ) : (
                          "Completed"
                        )}
                      </td>
                    )}
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

export default SalesOrders;
