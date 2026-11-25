
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Date,
    DateTime,
    Text
)
from sqlalchemy.dialects.postgresql import JSONB

from database import Base


# 1. AUDIT LOGS
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False)
    user_role = Column(String, nullable=False)
    action = Column(String, nullable=False)
    module = Column(String, nullable=False)
    details = Column(Text, default="")
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )


# 2. PRODUCTS
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String, nullable=False)
    packet_size = Column(String, default="250g")
    price = Column(Numeric(10, 2), default=0.00)
    status = Column(String, default="Active")
    description = Column(String, nullable=True)


# 3. CUSTOMERS
class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, default="Retailer", nullable=False)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)


# 4. SUPPLIERS
class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)


# 5. RAW MATERIAL INVENTORY
class RawMaterial(Base):
    __tablename__ = "raw_materials"

    id = Column(Integer, primary_key=True, index=True)
    material = Column(String, unique=True, nullable=False)
    quantity = Column(Numeric(10, 2), default=0)
    unit = Column(String, nullable=False)
    minimum_stock = Column(Numeric(10, 2), default=0)


# 6. PURCHASES
class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    supplier = Column(String, nullable=False)
    material = Column(String, nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String, nullable=False)
    price = Column(Numeric(10, 2), default=0)
    total = Column(Numeric(12, 2), default=0)
    date = Column(Date, nullable=False)


# 7. FINISHED GOODS INVENTORY
class FinishedProduct(Base):
    __tablename__ = "finished_products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String, nullable=False)
    quantity = Column(Integer, default=0)
    unit = Column(String, default="packets")
    minimum_stock = Column(Integer, default=0)


# 8. PRODUCTION BATCHES
class ProductionBatch(Base):
    __tablename__ = "production_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_no = Column(String, unique=True, nullable=False)
    product = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, default="Completed")
    recipe = Column(JSONB)


# 9. SALES ORDERS
class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String, unique=True, nullable=False)
    customer = Column(String, nullable=False)
    product = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    total = Column(Numeric(12, 2), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, default="Pending")
    district = Column(String, nullable=True)


# 10. GST INVOICES
class GSTInvoice(Base):
    __tablename__ = "gst_invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String, unique=True, nullable=False)
    customer = Column(String, nullable=False)
    product = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    taxable_amount = Column(Numeric(12, 2), nullable=False)
    gst_rate = Column(Numeric(5, 2), nullable=False)
    cgst = Column(Numeric(10, 2), default=0)
    sgst = Column(Numeric(10, 2), default=0)
    igst = Column(Numeric(10, 2), default=0)
    total = Column(Numeric(12, 2), nullable=False)
    invoice_type = Column(String, nullable=False)
    date = Column(Date, nullable=False)


# 11. PAYMENTS
class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_no = Column(String, unique=True, nullable=False)
    invoice_no = Column(String, nullable=False)
    customer = Column(String, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    method = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, default="Pending")


# 12. COST RECORDS
class CostRecord(Base):
    __tablename__ = "cost_records"

    id = Column(Integer, primary_key=True, index=True)
    product = Column(String, nullable=False)
    batch_quantity = Column(Integer, nullable=False)
    material_cost = Column(Numeric(12, 2), default=0)
    labour_cost = Column(Numeric(12, 2), default=0)
    packaging_cost = Column(Numeric(12, 2), default=0)
    other_cost = Column(Numeric(12, 2), default=0)
    selling_price = Column(Numeric(10, 2), default=0)
    total_cost = Column(Numeric(12, 2), default=0)
    cost_per_packet = Column(Numeric(10, 2), default=0)
    profit_per_packet = Column(Numeric(10, 2), default=0)
    date = Column(Date, nullable=False)
