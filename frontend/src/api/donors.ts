const BASE = '/api'

export interface Donor {
  donor_id: string
  name: string
  type: 'individual' | 'business' | 'org'
  email: string | null
  phone: string | null
  tax_id: string | null
  created_at: string
}

export interface Donation {
  donation_id: string
  donor_id: string
  received_date: string
  donation_type: 'food' | 'funds' | 'goods'
  estimated_value: string | null
  notes: string | null
}

export interface DonorCreate {
  name: string
  type: 'individual' | 'business' | 'org'
  email?: string
  phone?: string
  tax_id?: string
}

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>

async function checked<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string }
    throw new Error(err.detail ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const donorsApi = {
  list: (f: Fetcher) => f(`${BASE}/donors`).then(r => checked<Donor[]>(r)),
  get: (f: Fetcher, id: string) => f(`${BASE}/donors/${id}`).then(r => checked<Donor>(r)),
  create: (f: Fetcher, body: DonorCreate) =>
    f(`${BASE}/donors`, { method: 'POST', body: JSON.stringify(body) }).then(r => checked<Donor>(r)),
  donations: (f: Fetcher, id: string) =>
    f(`${BASE}/donors/${id}/donations`).then(r => checked<Donation[]>(r)),
}
