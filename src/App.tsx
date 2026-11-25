
import { useEffect, useState } from "react";
import Login, { type UserRole } from "./Login";
import Products from "./products";
import Customers from "./customers";
import Suppliers from "./suppliers";
import Purchases from "./Purchases";
import Inventory, { type StockItem } from "./Inventory";
import Production from "./Production";
import FinishedGoods, {
  type FinishedProduct,
} from "./FinishedGoods";
import SalesOrders from "./SalesOrders";
import SalesReports from "./SalesReports";
import Reports from "./Reports";
import Audit from "./Audit";
import type { SalesOrder } from "./SalesTypes";
import GSTInvoices from "./GSTInvoices";
import Payments from "./Payments";
import Costing from "./Costing";
import { apiGet, setApiUser } from "./api";
import "./App.css";

type LoggedInUser = {
  email: string;
  role: UserRole;
};

type BackendStockItem = {
  id: number;
  material: string;
  quantity: number | string;
  unit: string;
  minimum_stock: number | string;
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

const adminMenu = [
  "Dashboard",
  "Products",
  "Customers",
  "Suppliers",
  "Purchases",
  "Inventory",
  "Production",
  "Finished Goods",
  "Sales Orders",
  "Sales Reports",
  "GST Invoices",
  "Payments",
  "Costing",
  "Reports",
  "Audit",
];

const staffMenu = [
  "Dashboard",
  "Products",
  "Customers",
  "Sales Orders",
  "Inventory",
  "Production",
  "Finished Goods",
];

function mapStock(item: BackendStockItem): StockItem {
  return {
    id: item.id,
    material: item.material,
    quantity: Number(item.quantity),
    unit: item.unit,
    minimumStock: Number(item.minimum_stock),
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

function mapSalesOrder(item: BackendSalesOrder): SalesOrder {
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

function App() {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [activePage, setActivePage] = useState("Dashboard");

  const [stock, setStock] = useState<StockItem[]>([]);
  const [finishedProducts, setFinishedProducts] =
    useState<FinishedProduct[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);

  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  // Load shared business data after login
  useEffect(() => {
    if (!user) return;

    let active = true;

    async function loadBusinessData() {
      setDataLoading(true);
      setDataError("");

      const results = await Promise.allSettled([
        apiGet<BackendStockItem[]>("/raw-materials"),
        apiGet<BackendFinishedProduct[]>("/finished-goods"),
        apiGet<BackendSalesOrder[]>("/sales-orders"),
        apiGet<any[]>("/products"),
        apiGet<any[]>("/customers"),
        apiGet<any[]>("/suppliers"),
      ]);

      if (!active) return;

      const errors: string[] = [];

      if (results[0].status === "fulfilled") {
        setStock(results[0].value.map(mapStock));
      } else {
        errors.push("Raw materials");
      }

      if (results[1].status === "fulfilled") {
        setFinishedProducts(
          results[1].value.map(mapFinishedProduct)
        );
      } else {
        errors.push("Finished goods");
      }

      if (results[2].status === "fulfilled") {
        setOrders(results[2].value.map(mapSalesOrder));
      } else {
        errors.push("Sales orders");
      }

      if (results[3].status === "fulfilled") {
        setProductCount(results[3].value.length);
      } else {
        errors.push("Products");
      }

      if (results[4].status === "fulfilled") {
        setCustomerCount(results[4].value.length);
      } else {
        errors.push("Customers");
      }

      if (results[5].status === "fulfilled") {
        setSupplierCount(results[5].value.length);
      } else {
        errors.push("Suppliers");
      }

      if (errors.length > 0) {
        setDataError(
          `Unable to load: ${errors.join(", ")}. Check the backend connection.`
        );
      }

      setDataLoading(false);
    }

    void loadBusinessData();

    return () => {
      active = false;
    };
  }, [user]);

  // Save authentication activity in PostgreSQL
  const saveAuditLog = async (
    email: string,
    role: UserRole,
    action: string,
    details: string
  ) => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/audit-logs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": email,
            "x-user-role": role,
          },
          body: JSON.stringify({
            user_email: email,
            user_role: role,
            action,
            module: "Authentication",
            details,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save audit activity.");
      }
    } catch (error) {
      console.error("Audit tracking error:", error);
    }
  };

  // Login tracking
  const handleLogin = (email: string, role: UserRole) => {
    setApiUser({ email, role });
    setUser({ email, role });
    setActivePage("Dashboard");

    void saveAuditLog(
      email,
      role,
      "Login",
      "User logged into the system"
    );
  };

  // Logout tracking
  const handleLogout = () => {
    if (user) {
      void saveAuditLog(
        user.email,
        user.role,
        "Logout",
        "User logged out of the system"
      );
    }

    setApiUser(null);
    setUser(null);
    setActivePage("Dashboard");

    setStock([]);
    setFinishedProducts([]);
    setOrders([]);
    setProductCount(0);
    setCustomerCount(0);
    setSupplierCount(0);
    setDataError("");
  };

  // Update shared raw material stock after a purchase
  function handlePurchaseSaved(
    material: string,
    quantity: number,
    unit: string
  ): boolean {
    const existingMaterial = stock.find(
      (item) => item.material === material
    );

    if (!existingMaterial) {
      alert(`${material} is not available in Inventory.`);
      return false;
    }

    if (existingMaterial.unit !== unit) {
      alert(`Unit mismatch for ${material}.`);
      return false;
    }

    if (existingMaterial.quantity + quantity < 0) {
      alert(`Insufficient stock to reverse this purchase.`);
      return false;
    }

    setStock((previous) =>
      previous.map((item) =>
        item.material === material
          ? {
              ...item,
              quantity: item.quantity + quantity,
            }
          : item
      )
    );

    return true;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const menuItems =
    user.role === "Admin" ? adminMenu : staffMenu;

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return (
          <Dashboard
            role={user.role}
            stock={stock}
            finishedProducts={finishedProducts}
            productCount={productCount}
            customerCount={customerCount}
            supplierCount={supplierCount}
            loading={dataLoading}
          />
        );

      case "Products":
        return <Products role={user.role} />;

      case "Customers":
        return <Customers role={user.role} />;

      case "Suppliers":
        return user.role === "Admin" ? (
          <Suppliers role={user.role} />
        ) : null;

      case "Purchases":
        return user.role === "Admin" ? (
          <Purchases
            role={user.role}
            onPurchaseSaved={handlePurchaseSaved}
          />
        ) : null;

      case "Inventory":
        return (
          <Inventory
            role={user.role}
            stock={stock}
            onStockUpdate={setStock}
          />
        );

      case "Production":
        return (
          <Production
            role={user.role}
            stock={stock}
            onStockUpdate={setStock}
            finishedProducts={finishedProducts}
            onFinishedGoodsUpdate={setFinishedProducts}
          />
        );

      case "Finished Goods":
        return (
          <FinishedGoods
            role={user.role}
            products={finishedProducts}
            onProductsUpdate={setFinishedProducts}
          />
        );

      case "Sales Orders":
        return (
          <SalesOrders
            role={user.role}
            products={finishedProducts}
            onProductsUpdate={setFinishedProducts}
            orders={orders}
            onOrdersUpdate={setOrders}
          />
        );

      case "Sales Reports":
        return user.role === "Admin" ? (
          <SalesReports orders={orders} />
        ) : null;

      case "GST Invoices":
        return user.role === "Admin" ? (
          <GSTInvoices role={user.role} />
        ) : null;

      case "Payments":
        return user.role === "Admin" ? (
          <Payments role={user.role} />
        ) : null;

      case "Costing":
        return user.role === "Admin" ? (
          <Costing role={user.role} />
        ) : null;

      case "Reports":
        return user.role === "Admin" ? (
          <Reports orders={orders} />
        ) : null;

      case "Audit":
        return user.role === "Admin" ? (
          <Audit email={user.email} />
        ) : null;

      default:
        return (
          <div className="products-page">
            <h1>{activePage}</h1>
            <p>
              This module will be developed in the upcoming phase.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>SID</h2>
          <p>Traditional Dishes</p>
        </div>

        <div className="sidebar-menu">
          <p className="menu-heading">MAIN MENU</p>

          {menuItems.map((item) => (
            <button
              key={item}
              className={
                activePage === item
                  ? "menu-item active"
                  : "menu-item"
              }
              onClick={() => setActivePage(item)}
            >
              <span>{getIcon(item)}</span>
              {item}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <p>South Indian Traditional Dishes</p>
          <span>Manufacturing Management</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="topbar-label">MANAGEMENT SYSTEM</p>
            <h2>{activePage}</h2>
          </div>

          <div className="profile-section">
            <div className="profile-info">
              <strong>{user.role}</strong>
              <span>{user.email}</span>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <section className="page-content">
          {dataError && (
            <div className="error-message" role="alert">
              {dataError}
            </div>
          )}

          {renderPage()}
        </section>
      </main>
    </div>
  );
}

type DashboardProps = {
  role: UserRole;
  stock: StockItem[];
  finishedProducts: FinishedProduct[];
  productCount: number;
  customerCount: number;
  supplierCount: number;
  loading: boolean;
};

function Dashboard({
  role,
  stock,
  finishedProducts,
  productCount,
  customerCount,
  supplierCount,
  loading,
}: DashboardProps) {
  const lowStockCount = stock.filter(
    (item) => item.quantity <= item.minimumStock
  ).length;

  const totalFinishedStock = finishedProducts.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <>
      <div className="welcome-banner">
        <div className="banner-content">
          <p>BUSINESS OVERVIEW</p>
          <h1>Welcome Back!</h1>
          <span>
            Manage your traditional snacks manufacturing business.
          </span>
        </div>
      </div>

      {loading && <p>Loading business information...</p>}

      <div className="dashboard-stats">
        <StatCard
          title="Total Products"
          value={String(productCount)}
          icon="📦"
        />

        <StatCard
          title="Customers"
          value={String(customerCount)}
          icon="👥"
        />

        <StatCard
          title="Suppliers"
          value={String(supplierCount)}
          icon="🚚"
        />

        <StatCard
          title="Raw Materials"
          value={String(stock.length)}
          icon="🌾"
        />

        <StatCard
          title="Low Stock Items"
          value={String(lowStockCount)}
          icon="⚠️"
        />

        <StatCard
          title="Finished Goods"
          value={String(totalFinishedStock)}
          icon="🏬"
        />
      </div>

      <div className="dashboard-panels">
        <div className="dashboard-panel">
          <h3>Production Overview</h3>
          <p>Manage your manufacturing activities.</p>

          <div className="quick-info">
            <span>Available Products</span>
            <strong>Murukku, Mixture, Chips, Sweets</strong>
          </div>

          <div className="quick-info">
            <span>Production Management</span>
            <strong>Bill of Materials and Batch Tracking</strong>
          </div>
        </div>

        <div className="dashboard-panel">
          <h3>Quick Information</h3>

          <div className="quick-info">
            <span>Logged-in Role</span>
            <strong>{role}</strong>
          </div>

          <div className="quick-info">
            <span>Raw Material Count</span>
            <strong>{stock.length}</strong>
          </div>

          <div className="quick-info">
            <span>Low Stock Items</span>
            <strong>{lowStockCount}</strong>
          </div>

          <div className="quick-info">
            <span>Finished Product Types</span>
            <strong>{finishedProducts.length}</strong>
          </div>
        </div>
      </div>
    </>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  icon: string;
};

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">{icon}</div>

      <div>
        <p>{title}</p>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

function getIcon(item: string) {
  const icons: Record<string, string> = {
    Dashboard: "🏠",
    Products: "📦",
    Customers: "👥",
    Suppliers: "🚚",
    "Sales Orders": "🛒",
    "Sales Reports": "📊",
    Purchases: "🧾",
    Inventory: "🏬",
    Production: "⚙️",
    "Finished Goods": "📦",
    "GST Invoices": "📄",
    Payments: "💳",
    Costing: "💰",
    Reports: "📊",
    Audit: "🔍",
  };

  return icons[item] || "📌";
}

export default App;
