const BASE = '/api'

export interface Route {
  route_id: string
  route_date: string
  shift_id: string | null
  status: string
  vehicle: string | null
}

export interface RouteCreate {
  route_date: string
  status: string
  vehicle?: string
}

export interface RouteStop {
  stop_id: string
  route_id: string
  recipient_id: string
  sequence_number: number
  estimated_arrival: string | null
  status: string
}

export interface RouteStopCreate {
  recipient_id: string
  sequence_number: number
  estimated_arrival?: string
}

export interface RouteStopItem {
  route_stop_item_id: string
  stop_id: string
  item_id: string
  quantity_delivered: string
}

export interface RouteStopItemCreate {
  item_id: string
  quantity_delivered: string
}

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>

async function checked<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string }
    throw new Error(err.detail ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const routesApi = {
  list: (f: Fetcher) => f(`${BASE}/routes`).then(r => checked<Route[]>(r)),
  get: (f: Fetcher, id: string) => f(`${BASE}/routes/${id}`).then(r => checked<Route>(r)),
  create: (f: Fetcher, body: RouteCreate) =>
    f(`${BASE}/routes`, { method: 'POST', body: JSON.stringify(body) }).then(r => checked<Route>(r)),
  stops: (f: Fetcher, routeId: string) =>
    f(`${BASE}/routes/${routeId}/stops`).then(r => checked<RouteStop[]>(r)),
  addStop: (f: Fetcher, routeId: string, body: RouteStopCreate) =>
    f(`${BASE}/routes/${routeId}/stops`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(r => checked<RouteStop>(r)),
  stopItems: (f: Fetcher, routeId: string, stopId: string) =>
    f(`${BASE}/routes/${routeId}/stops/${stopId}/items`).then(r => checked<RouteStopItem[]>(r)),
  addStopItem: (f: Fetcher, routeId: string, stopId: string, body: RouteStopItemCreate) =>
    f(`${BASE}/routes/${routeId}/stops/${stopId}/items`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(r => checked<RouteStopItem>(r)),
}
