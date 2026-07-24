import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeftIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { routesApi } from '@/api/routes'
import { recipientsApi } from '@/api/recipients'
import { inventoryItemsApi, type InventoryItem } from '@/api/inventory-items'
import { StopItemsPanel } from '@/components/routes/StopItemsPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

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

const addStopFormSchema = z.object({
  recipient_id: z.string().min(1, 'Select a recipient'),
  sequence_number: z
    .string()
    .min(1, 'Sequence number is required')
    .refine(v => Number.isInteger(Number(v)) && Number(v) > 0, 'Must be a positive whole number'),
  estimated_arrival: z.string(),
})

type AddStopFormValues = z.infer<typeof addStopFormSchema>

export function RouteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { fetchWithAuth } = useAuth()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)

  const {
    data: route,
    isLoading: routeLoading,
    error: routeError,
  } = useQuery({
    queryKey: ['route', id],
    queryFn: () => routesApi.get(fetchWithAuth, id!),
    enabled: !!id,
  })

  const {
    data: stops,
    isLoading: stopsLoading,
    error: stopsError,
  } = useQuery({
    queryKey: ['route', id, 'stops'],
    queryFn: () => routesApi.stops(fetchWithAuth, id!),
    enabled: !!id,
  })

  const { data: recipients } = useQuery({
    queryKey: ['recipients'],
    queryFn: () => recipientsApi.list(fetchWithAuth),
  })

  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => inventoryItemsApi.list(fetchWithAuth),
  })

  const recipientMap = useMemo(() => {
    const map = new Map<string, string>()
    recipients?.forEach(r => map.set(r.recipient_id, r.name))
    return map
  }, [recipients])

  const inventoryMap = useMemo(() => {
    const map = new Map<string, InventoryItem>()
    inventoryItems?.forEach(item => map.set(item.item_id, item))
    return map
  }, [inventoryItems])

  const nextSequence = useMemo(() => {
    if (!stops || stops.length === 0) return 1
    return Math.max(...stops.map(s => s.sequence_number)) + 1
  }, [stops])

  const form = useForm<AddStopFormValues>({
    resolver: zodResolver(addStopFormSchema),
    defaultValues: { recipient_id: '', sequence_number: '1', estimated_arrival: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: AddStopFormValues) =>
      routesApi.addStop(fetchWithAuth, id!, {
        recipient_id: values.recipient_id,
        sequence_number: Number(values.sequence_number),
        ...(values.estimated_arrival ? { estimated_arrival: values.estimated_arrival } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['route', id, 'stops'] })
      closeDialog()
    },
  })

  function openDialog() {
    form.reset({ recipient_id: '', sequence_number: String(nextSequence), estimated_arrival: '' })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    mutation.reset()
  }

  function onSubmit(values: AddStopFormValues) {
    mutation.mutate(values)
  }

  const selectedRecipientId = form.watch('recipient_id')

  return (
    <div className="p-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        nativeButton={false}
        render={<Link to="/dashboard/routes" />}
      >
        <ArrowLeftIcon />
        Back to Routes
      </Button>

      <Card className="mb-6">
        <CardContent>
          {routeError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load route: {(routeError as Error).message}
              </AlertDescription>
            </Alert>
          )}
          {routeLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {route && (
            <>
              <div className="flex items-start justify-between mb-4">
                <CardTitle className="text-2xl">
                  {new Date(route.route_date).toLocaleDateString()}
                </CardTitle>
                <Badge variant="secondary">{route.status}</Badge>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoField label="Vehicle" value={route.vehicle} />
              </dl>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stops</CardTitle>
          <Button size="sm" onClick={openDialog}>
            Add Stop
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {stopsLoading && (
            <p className="px-4 py-6 text-sm text-muted-foreground">Loading stops…</p>
          )}
          {stopsError && (
            <p className="px-4 py-6 text-sm text-destructive">
              Failed to load stops: {(stopsError as Error).message}
            </p>
          )}
          {!stopsLoading && stops?.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No stops yet. Add one to get started.
            </p>
          )}
          {stops?.map(stop => (
            <StopItemsPanel
              key={stop.stop_id}
              routeId={id!}
              stop={stop}
              recipientName={recipientMap.get(stop.recipient_id) ?? stop.recipient_id}
              inventoryItems={inventoryItems ?? []}
              inventoryMap={inventoryMap}
            />
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          if (!open) closeDialog()
          else openDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stop</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="recipient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Recipient <span className="text-destructive">*</span>
                    </FormLabel>
                    <Popover open={comboOpen} onOpenChange={setComboOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={comboOpen}
                            className="w-full justify-between font-normal"
                          />
                        }
                      >
                        {field.value
                          ? recipientMap.get(field.value)
                          : 'Select recipient…'}
                        <ChevronsUpDownIcon className="opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent className="w-(--anchor-width) p-0">
                        <Command>
                          <CommandInput placeholder="Search recipients…" />
                          <CommandList>
                            <CommandEmpty>No recipient found.</CommandEmpty>
                            <CommandGroup>
                              {recipients?.map(recipient => (
                                <CommandItem
                                  key={recipient.recipient_id}
                                  value={recipient.name}
                                  data-checked={
                                    recipient.recipient_id === selectedRecipientId
                                      ? 'true'
                                      : undefined
                                  }
                                  onSelect={() => {
                                    field.onChange(recipient.recipient_id)
                                    setComboOpen(false)
                                  }}
                                >
                                  {recipient.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sequence_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Sequence Number <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_arrival"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Arrival</FormLabel>
                    <FormControl>
                      <Input type="time" step="1" {...field} />
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
                  {mutation.isPending ? 'Saving…' : 'Add Stop'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
