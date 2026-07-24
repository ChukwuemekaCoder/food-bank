import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDownIcon, ChevronRightIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { routesApi, type RouteStop } from '@/api/routes'
import type { InventoryItem } from '@/api/inventory-items'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

const CATEGORY_LABELS = {
  produce: 'Produce',
  canned: 'Canned',
  dairy: 'Dairy',
  frozen: 'Frozen',
  dry_goods: 'Dry Goods',
  other: 'Other',
} as const

function itemLabel(item: InventoryItem) {
  const desc = item.description || CATEGORY_LABELS[item.category]
  return `${desc} (${item.quantity} ${item.unit} available)`
}

const stopItemFormSchema = z.object({
  item_id: z.string().min(1, 'Select an item'),
  quantity_delivered: z
    .string()
    .min(1, 'Quantity is required')
    .refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Quantity must be a positive number'),
})

type StopItemFormValues = z.infer<typeof stopItemFormSchema>

interface StopItemsPanelProps {
  routeId: string
  stop: RouteStop
  recipientName: string
  inventoryItems: InventoryItem[]
  inventoryMap: Map<string, InventoryItem>
}

export function StopItemsPanel({
  routeId,
  stop,
  recipientName,
  inventoryItems,
  inventoryMap,
}: StopItemsPanelProps) {
  const { fetchWithAuth } = useAuth()
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)

  const form = useForm<StopItemFormValues>({
    resolver: zodResolver(stopItemFormSchema),
    defaultValues: { item_id: '', quantity_delivered: '' },
  })

  const {
    data: items,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['route', routeId, 'stop', stop.stop_id, 'items'],
    queryFn: () => routesApi.stopItems(fetchWithAuth, routeId, stop.stop_id),
    enabled: expanded,
  })

  const mutation = useMutation({
    mutationFn: (values: StopItemFormValues) =>
      routesApi.addStopItem(fetchWithAuth, routeId, stop.stop_id, {
        item_id: values.item_id,
        quantity_delivered: values.quantity_delivered,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['route', routeId, 'stop', stop.stop_id, 'items'],
      })
      closeDialog()
    },
  })

  function closeDialog() {
    setDialogOpen(false)
    form.reset({ item_id: '', quantity_delivered: '' })
    mutation.reset()
  }

  function onSubmit(values: StopItemFormValues) {
    mutation.mutate(values)
  }

  const selectedItemId = form.watch('item_id')

  return (
    <div className="border-t border-border first:border-t-0">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 text-sm font-medium"
        >
          {expanded ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
          <span className="text-muted-foreground font-normal">#{stop.sequence_number}</span>
          {recipientName}
          {stop.estimated_arrival && (
            <span className="text-muted-foreground font-normal">
              · ETA {formatTime(stop.estimated_arrival)}
            </span>
          )}
          <Badge variant="secondary">{stop.status}</Badge>
        </button>
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
          Add Item
        </Button>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantity Delivered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                    Loading items…
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={2} className="py-6 text-center text-destructive text-sm">
                    Failed to load items: {(error as Error).message}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && items?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                    No items allocated yet.
                  </TableCell>
                </TableRow>
              )}
              {items?.map(rsi => {
                const item = inventoryMap.get(rsi.item_id)
                return (
                  <TableRow key={rsi.route_stop_item_id}>
                    <TableCell>
                      {item ? item.description || CATEGORY_LABELS[item.category] : rsi.item_id}
                    </TableCell>
                    <TableCell>
                      {rsi.quantity_delivered} {item?.unit ?? ''}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          if (!open) closeDialog()
          else setDialogOpen(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to Stop</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Item <span className="text-destructive">*</span>
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
                          ? itemLabel(inventoryMap.get(field.value)!)
                          : 'Select item…'}
                        <ChevronsUpDownIcon className="opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent className="w-(--anchor-width) p-0">
                        <Command>
                          <CommandInput placeholder="Search items…" />
                          <CommandList>
                            <CommandEmpty>No item found.</CommandEmpty>
                            <CommandGroup>
                              {inventoryItems.map(item => (
                                <CommandItem
                                  key={item.item_id}
                                  value={itemLabel(item)}
                                  data-checked={item.item_id === selectedItemId ? 'true' : undefined}
                                  onSelect={() => {
                                    field.onChange(item.item_id)
                                    setComboOpen(false)
                                  }}
                                >
                                  {itemLabel(item)}
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
                name="quantity_delivered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantity Delivered <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" placeholder="40" {...field} />
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
                  {mutation.isPending ? 'Saving…' : 'Add Item'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
