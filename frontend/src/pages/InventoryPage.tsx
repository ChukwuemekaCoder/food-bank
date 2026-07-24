import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/AuthContext'
import { inventoryItemsApi, type InventoryItemCreate } from '@/api/inventory-items'
import { getExpirationUrgency, EXPIRATION_URGENCY_CLASSNAME } from '@/lib/expiration'
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

const CATEGORY_LABELS = {
  produce: 'Produce',
  canned: 'Canned',
  dairy: 'Dairy',
  frozen: 'Frozen',
  dry_goods: 'Dry Goods',
  other: 'Other',
} as const

const STATUS_BADGE_CLASSNAME: Record<string, string> = {
  available: 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
  reserved: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
  distributed: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
  expired: 'border-transparent bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
}

function statusBadgeClassName(status: string) {
  return STATUS_BADGE_CLASSNAME[status] ?? ''
}

const inventoryFormSchema = z.object({
  category: z.enum(['produce', 'canned', 'dairy', 'frozen', 'dry_goods', 'other']),
  quantity: z
    .string()
    .min(1, 'Quantity is required')
    .refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Quantity must be a positive number'),
  unit: z.string().min(1, 'Unit is required'),
  description: z.string(),
  expiration_date: z.string(),
  storage_location: z.string(),
})

type InventoryFormValues = z.infer<typeof inventoryFormSchema>

const emptyForm: InventoryFormValues = {
  category: 'produce',
  quantity: '',
  unit: '',
  description: '',
  expiration_date: '',
  storage_location: '',
}

export function InventoryPage() {
  const { fetchWithAuth } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: emptyForm,
  })

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => inventoryItemsApi.list(fetchWithAuth),
  })

  const mutation = useMutation({
    mutationFn: (body: InventoryItemCreate) => inventoryItemsApi.create(fetchWithAuth, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      closeDialog()
    },
  })

  function closeDialog() {
    setDialogOpen(false)
    form.reset(emptyForm)
    mutation.reset()
  }

  function onSubmit(values: InventoryFormValues) {
    const body: InventoryItemCreate = {
      category: values.category,
      quantity: values.quantity,
      unit: values.unit,
      ...(values.description ? { description: values.description } : {}),
      ...(values.expiration_date ? { expiration_date: values.expiration_date } : {}),
      ...(values.storage_location ? { storage_location: values.storage_location } : {}),
    }
    mutation.mutate(body)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button onClick={() => setDialogOpen(true)}>+ New Item</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Failed to load inventory: {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Expiration</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                Loading inventory…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && items?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                No inventory items yet. Add one to get started.
              </TableCell>
            </TableRow>
          )}
          {items?.map(item => {
            const urgency = getExpirationUrgency(item.expiration_date)
            return (
              <TableRow
                key={item.item_id}
                onClick={() => navigate(`/dashboard/inventory/${item.item_id}`)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">{CATEGORY_LABELS[item.category]}</TableCell>
                <TableCell className="text-muted-foreground">{item.description ?? '—'}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell className={EXPIRATION_URGENCY_CLASSNAME[urgency]}>
                  {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusBadgeClassName(item.status)}>
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
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
            <DialogTitle>New Inventory Item</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Quantity <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" placeholder="50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Unit <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="cans" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Chickpeas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiration_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storage_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Shelf A3" {...field} />
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
                  {mutation.isPending ? 'Saving…' : 'Create Item'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
