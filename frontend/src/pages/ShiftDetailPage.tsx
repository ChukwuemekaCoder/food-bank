import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { shiftsApi } from '@/api/shifts'
import { volunteersApi } from '@/api/volunteers'
import { formatTime } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

const SHIFT_TYPE_LABELS = {
  sorting: 'Sorting',
  driving: 'Driving',
  packing: 'Packing',
} as const

const SHIFT_TYPE_BADGE_CLASSNAME: Record<string, string> = {
  sorting: 'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400',
  driving: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
  packing: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{value ?? '—'}</dd>
    </div>
  )
}

export function ShiftDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { fetchWithAuth } = useAuth()
  const queryClient = useQueryClient()

  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('')

  const {
    data: shift,
    isLoading: shiftLoading,
    error: shiftError,
  } = useQuery({
    queryKey: ['shift', id],
    queryFn: () => shiftsApi.get(fetchWithAuth, id!),
    enabled: !!id,
  })

  const {
    data: assignments,
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useQuery({
    queryKey: ['shift', id, 'assignments'],
    queryFn: () => shiftsApi.assignments(fetchWithAuth, id!),
    enabled: !!id,
  })

  const { data: volunteers } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => volunteersApi.list(fetchWithAuth),
  })

  const volunteerMap = useMemo(() => {
    const map = new Map<string, string>()
    volunteers?.forEach(v => map.set(v.volunteer_id, v.name))
    return map
  }, [volunteers])

  const availableVolunteers = useMemo(() => {
    const assignedIds = new Set(assignments?.map(a => a.volunteer_id) ?? [])
    return (volunteers ?? []).filter(v => !assignedIds.has(v.volunteer_id))
  }, [volunteers, assignments])

  const assignMutation = useMutation({
    mutationFn: () => shiftsApi.assign(fetchWithAuth, id!, { volunteer_id: selectedVolunteerId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shift', id, 'assignments'] })
      closeAssignDialog()
    },
  })

  function closeAssignDialog() {
    setAssignDialogOpen(false)
    setSelectedVolunteerId('')
    assignMutation.reset()
  }

  return (
    <div className="p-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        nativeButton={false}
        render={<Link to="/dashboard/shifts" />}
      >
        <ArrowLeftIcon />
        Back to Shifts
      </Button>

      <Card className="mb-6">
        <CardContent>
          {shiftError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load shift: {(shiftError as Error).message}
              </AlertDescription>
            </Alert>
          )}
          {shiftLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {shift && (
            <>
              <div className="flex items-start justify-between mb-4">
                <CardTitle className="text-2xl">
                  {new Date(shift.shift_date).toLocaleDateString()}
                </CardTitle>
                <Badge variant="outline" className={SHIFT_TYPE_BADGE_CLASSNAME[shift.shift_type]}>
                  {SHIFT_TYPE_LABELS[shift.shift_type]}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoField label="Start Time" value={formatTime(shift.start_time)} />
                <InfoField label="End Time" value={formatTime(shift.end_time)} />
                <InfoField label="Capacity" value={shift.capacity} />
              </dl>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assigned Volunteers</CardTitle>
          <Button size="sm" onClick={() => setAssignDialogOpen(true)}>
            Assign Volunteer
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Volunteer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignmentsLoading && (
                <TableRow>
                  <TableCell colSpan={2} className="py-10 text-center text-muted-foreground">
                    Loading assignments…
                  </TableCell>
                </TableRow>
              )}
              {assignmentsError && (
                <TableRow>
                  <TableCell colSpan={2} className="py-6 text-center text-destructive text-sm">
                    Failed to load assignments: {(assignmentsError as Error).message}
                  </TableCell>
                </TableRow>
              )}
              {!assignmentsLoading && assignments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-10 text-center text-muted-foreground">
                    No volunteers assigned yet.
                  </TableCell>
                </TableRow>
              )}
              {assignments?.map(a => (
                <TableRow key={a.assignment_id}>
                  <TableCell className="pl-4 font-medium">
                    {volunteerMap.get(a.volunteer_id) ?? a.volunteer_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{a.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={assignDialogOpen}
        onOpenChange={open => {
          if (!open) closeAssignDialog()
          else setAssignDialogOpen(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Volunteer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboOpen}
                    className="w-full justify-between font-normal"
                  />
                }
              >
                {selectedVolunteerId
                  ? volunteerMap.get(selectedVolunteerId)
                  : 'Select volunteer…'}
                <ChevronsUpDownIcon className="opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-(--anchor-width) p-0">
                <Command>
                  <CommandInput placeholder="Search volunteers…" />
                  <CommandList>
                    <CommandEmpty>No volunteer found.</CommandEmpty>
                    <CommandGroup>
                      {availableVolunteers.map(v => (
                        <CommandItem
                          key={v.volunteer_id}
                          value={v.name}
                          data-checked={v.volunteer_id === selectedVolunteerId ? 'true' : undefined}
                          onSelect={() => {
                            setSelectedVolunteerId(v.volunteer_id)
                            setComboOpen(false)
                          }}
                        >
                          {v.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {assignMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>{(assignMutation.error as Error).message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={closeAssignDialog}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!selectedVolunteerId || assignMutation.isPending}
                onClick={() => assignMutation.mutate()}
              >
                {assignMutation.isPending ? 'Assigning…' : 'Assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
