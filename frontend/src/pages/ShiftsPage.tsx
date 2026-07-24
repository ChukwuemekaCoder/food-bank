import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/AuthContext'
import { shiftsApi, type ShiftCreate } from '@/api/shifts'
import { formatTime } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

const shiftFormSchema = z.object({
  shift_date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  shift_type: z.enum(['sorting', 'driving', 'packing']),
  capacity: z
    .string()
    .min(1, 'Capacity is required')
    .refine(
      v => Number.isInteger(Number(v)) && Number(v) > 0,
      'Capacity must be a positive whole number'
    ),
})

type ShiftFormValues = z.infer<typeof shiftFormSchema>

const emptyForm: ShiftFormValues = {
  shift_date: '',
  start_time: '',
  end_time: '',
  shift_type: 'sorting',
  capacity: '',
}

export function ShiftsPage() {
  const { fetchWithAuth } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: emptyForm,
  })

  const { data: shifts, isLoading, error } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => shiftsApi.list(fetchWithAuth),
  })

  const mutation = useMutation({
    mutationFn: (body: ShiftCreate) => shiftsApi.create(fetchWithAuth, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shifts'] })
      closeDialog()
    },
  })

  function closeDialog() {
    setDialogOpen(false)
    form.reset(emptyForm)
    mutation.reset()
  }

  function onSubmit(values: ShiftFormValues) {
    const body: ShiftCreate = {
      shift_date: values.shift_date,
      start_time: values.start_time,
      end_time: values.end_time,
      shift_type: values.shift_type,
      capacity: Number(values.capacity),
    }
    mutation.mutate(body)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shifts</h1>
        <Button onClick={() => setDialogOpen(true)}>+ New Shift</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Failed to load shifts: {(error as Error).message}</AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Capacity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                Loading shifts…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && shifts?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                No shifts yet. Add one to get started.
              </TableCell>
            </TableRow>
          )}
          {shifts?.map(shift => (
            <TableRow
              key={shift.shift_id}
              onClick={() => navigate(`/dashboard/shifts/${shift.shift_id}`)}
              className="cursor-pointer"
            >
              <TableCell className="font-medium">
                {new Date(shift.shift_date).toLocaleDateString()}
              </TableCell>
              <TableCell>{formatTime(shift.start_time)}</TableCell>
              <TableCell>{formatTime(shift.end_time)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={SHIFT_TYPE_BADGE_CLASSNAME[shift.shift_type]}>
                  {SHIFT_TYPE_LABELS[shift.shift_type]}
                </Badge>
              </TableCell>
              <TableCell>{shift.capacity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          if (!open) closeDialog()
          else setDialogOpen(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Shift</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="shift_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Start Time <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="time" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        End Time <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="time" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="shift_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(SHIFT_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Capacity <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>{(mutation.error as Error).message}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving…' : 'Create Shift'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
