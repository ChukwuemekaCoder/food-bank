const BASE = '/api'

export interface Recipient {
  recipient_id: string
  name: string
  address: string | null
  contact_name: string | null
  phone: string | null
  household_or_capacity: number | null
  delivery_notes: string | null
}

export interface RecipientCreate {
  name: string
  address?: string
  contact_name?: string
  phone?: string
  household_or_capacity?: number
  delivery_notes?: string
}

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>

async function checked<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string }
    throw new Error(err.detail ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const recipientsApi = {
  list: (f: Fetcher) => f(`${BASE}/recipients`).then(r => checked<Recipient[]>(r)),
  create: (f: Fetcher, body: RecipientCreate) =>
    f(`${BASE}/recipients`, { method: 'POST', body: JSON.stringify(body) }).then(r =>
      checked<Recipient>(r)
    ),
}
