
export type SalesOrderStatus =
  | "Pending"
  | "Confirmed"
  | "Dispatched"
  | "Delivered";

export type SalesOrder = {
  id: number;
  orderNo: string;
  customer: string;
  product: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  status: SalesOrderStatus;
};
