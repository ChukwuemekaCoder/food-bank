const BASE = '/api'

export type ShiftType = 'sorting' | 'driving' | 'packing'

export interface Shift {
  shift_id: string
  shift_date: string
  start_time: string
  end_time: string
  shift_type: ShiftType
  capacity: number
}

export interface ShiftCreate {
  shift_date: string
  start_time: string
  end_time: string
  shift_type: ShiftType
  capacity: number
}

export interface ShiftAssignment {
  assignment_id: string
  shift_id: string
  volunteer_id: string
  status: string
}

export interface ShiftAssignmentCreate {
  volunteer_id: string
}

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>

async function checked<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string }
    throw new Error(err.detail ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const shiftsApi = {
  list: (f: Fetcher) => f(`${BASE}/shifts`).then(r => checked<Shift[]>(r)),
  get: (f: Fetcher, id: string) => f(`${BASE}/shifts/${id}`).then(r => checked<Shift>(r)),
  create: (f: Fetcher, body: ShiftCreate) =>
    f(`${BASE}/shifts`, { method: 'POST', body: JSON.stringify(body) }).then(r => checked<Shift>(r)),
  assignments: (f: Fetcher, shiftId: string) =>
    f(`${BASE}/shifts/${shiftId}/assignments`).then(r => checked<ShiftAssignment[]>(r)),
  assign: (f: Fetcher, shiftId: string, body: ShiftAssignmentCreate) =>
    f(`${BASE}/shifts/${shiftId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(r => checked<ShiftAssignment>(r)),
}
