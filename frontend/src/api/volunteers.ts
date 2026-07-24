const BASE = '/api'

export interface Volunteer {
  volunteer_id: string
  name: string
  email: string | null
  phone: string | null
  can_drive: boolean
  certifications: string | null
  active: boolean
}

export interface VolunteerCreate {
  name: string
  email?: string
  phone?: string
  can_drive?: boolean
  certifications?: string
}

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>

async function checked<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string }
    throw new Error(err.detail ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const volunteersApi = {
  list: (f: Fetcher) => f(`${BASE}/volunteers`).then(r => checked<Volunteer[]>(r)),
  get: (f: Fetcher, id: string) => f(`${BASE}/volunteers/${id}`).then(r => checked<Volunteer>(r)),
  create: (f: Fetcher, body: VolunteerCreate) =>
    f(`${BASE}/volunteers`, { method: 'POST', body: JSON.stringify(body) }).then(r =>
      checked<Volunteer>(r)
    ),
}
