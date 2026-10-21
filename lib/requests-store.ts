import { createHashStore } from "./hash-store";
import type { TgUser } from "./tg-auth";

// Заявки клиентов: расчёт, «хочу купить/заказать», поиск, легит-чек.
// Сохраняются все; клиенту из мини-аппа видны его заявки (по id Telegram).
import type { RequestStatus, RequestType } from "./request-constants";
export { REQUEST_STATUS_LABEL, REQUEST_TYPE_LABEL, type RequestStatus, type RequestType } from "./request-constants";

export interface CustomerRequest {
  id: string;
  createdAt: string;
  updatedAt?: string;
  type: RequestType;
  status: RequestStatus;
  title: string;
  username: string;
  tgId?: number;
  price?: number;
  // Ссылка для клиента: страница вещи или его ссылка на товар.
  link?: string;
}

const store = createHashStore<CustomerRequest>("yenway:requests:v1", "yenway:requests");

export function getRequests(): Promise<CustomerRequest[]> {
  return store.all();
}

export async function getUserRequests(tgId: number): Promise<CustomerRequest[]> {
  return (await store.all()).filter((r) => r.tgId === tgId);
}

// Запись заявки не должна ломать саму заявку — ошибки хранилища глотаем.
export async function recordRequest(
  input: Pick<CustomerRequest, "type" | "title" | "username" | "price" | "link">,
  user: TgUser | null
): Promise<void> {
  try {
    await store.put({
      ...input,
      title: input.title.slice(0, 200),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "new",
      ...(user ? { tgId: user.id } : {})
    });
  } catch (e) {
    console.error("Не удалось сохранить заявку:", e);
  }
}

export function setRequestStatus(id: string, status: RequestStatus): Promise<CustomerRequest> {
  return store.patch(id, { status, updatedAt: new Date().toISOString() }, "Заявка не найдена");
}

export function removeRequest(id: string): Promise<void> {
  return store.remove(id);
}
