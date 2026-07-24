const BASE = '/api'

export type InventoryCategory = 'produce' | 'canned' | 'dairy' | 'frozen' | 'dry_goods' | 'other'

export interface InventoryItem {
  item_id: string
  donation_id: string | null
  category: InventoryCategory
  description: string | null
  quantity: string
  unit: string
  expiration_date: string | null
  storage_location: string | null
  status: string
  created_at: string
}

export interface InventoryItemCreate {
  category: InventoryCategory
  quantity: string
  unit: string
  description?: string
  expiration_date?: string
  storage_location?: string
}

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>

async function checked<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string }
    throw new Error(err.detail ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const inventoryItemsApi = {
  list: (f: Fetcher) => f(`${BASE}/inventory-items`).then(r => checked<InventoryItem[]>(r)),
  get: (f: Fetcher, id: string) => f(`${BASE}/inventory-items/${id}`).then(r => checked<InventoryItem>(r)),
  create: (f: Fetcher, body: InventoryItemCreate) =>
    f(`${BASE}/inventory-items`, { method: 'POST', body: JSON.stringify(body) }).then(r =>
      checked<InventoryItem>(r)
    ),
}
