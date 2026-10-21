// Подписи заявок — можно импортировать и в браузере (без кода базы).
export type RequestType = "calc" | "buy" | "search" | "legit";
export type RequestStatus = "new" | "accepted" | "bought" | "shipping" | "delivered" | "canceled";

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  calc: "Расчёт стоимости",
  buy: "Заявка на вещь",
  search: "Поиск вещи",
  legit: "Легит-чек"
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  new: "Новая",
  accepted: "Принята",
  bought: "Выкуплена",
  shipping: "В пути",
  delivered: "Доставлена",
  canceled: "Отменена"
};

export interface CustomerRequestView {
  id: string;
  createdAt: string;
  type: RequestType;
  status: RequestStatus;
  title: string;
  username: string;
  tgId?: number;
  price?: number;
  link?: string;
}
