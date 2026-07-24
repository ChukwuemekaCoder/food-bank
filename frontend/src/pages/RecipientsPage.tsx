import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/AuthContext'
import { recipientsApi, type RecipientCreate } from '@/api/recipients'
import { Button } from '@/components/ui/button'
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

const recipientFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string(),
  contact_name: z.string(),
  phone: z.string(),
  household_or_capacity: z
    .string()
    .refine(v => v === '' || (Number.isInteger(Number(v)) && Number(v) > 0), {
      message: 'Must be a positive whole number',
    }),
})

type RecipientFormValues = z.infer<typeof recipientFormSchema>

const emptyForm: RecipientFormValues = {
  name: '',
  address: '',
  contact_name: '',
  phone: '',
  household_or_capacity: '',
}

export function RecipientsPage() {
  const { fetchWithAuth } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<RecipientFormValues>({
    resolver: zodResolver(recipientFormSchema),
    defaultValues: emptyForm,
  })

  const { data: recipients, isLoading, error } = useQuery({
    queryKey: ['recipients'],
    queryFn: () => recipientsApi.list(fetchWithAuth),
  })

  const mutation = useMutation({
    mutationFn: (body: RecipientCreate) => recipientsApi.create(fetchWithAuth, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recipients'] })
      closeDialog()
    },
  })

  function closeDialog() {
    setDialogOpen(false)
    form.reset(emptyForm)
    mutation.reset()
  }

  function onSubmit(values: RecipientFormValues) {
    const body: RecipientCreate = {
      name: values.name,
      ...(values.address ? { address: values.address } : {}),
      ...(values.contact_name ? { contact_name: values.contact_name } : {}),
      ...(values.phone ? { phone: values.phone } : {}),
      ...(values.household_or_capacity
        ? { household_or_capacity: Number(values.household_or_capacity) }
        : {}),
    }
    mutation.mutate(body)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Recipients</h1>
        <Button onClick={() => setDialogOpen(true)}>+ New Recipient</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Failed to load recipients: {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Contact Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Household/Capacity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                Loading recipients…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && recipients?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                No recipients yet. Add one to get started.
              </TableCell>
            </TableRow>
          )}
          {recipients?.map(recipient => (
            <TableRow key={recipient.recipient_id}>
              <TableCell className="font-medium">{recipient.name}</TableCell>
              <TableCell className="text-muted-foreground">{recipient.address ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {recipient.contact_name ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">{recipient.phone ?? '—'}</TableCell>
              <TableCell>{recipient.household_or_capacity ?? '—'}</TableCell>
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
            <DialogTitle>New Recipient</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Westside Food Pantry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Maria Lopez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="555-123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="household_or_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Household/Capacity</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="80" {...field} />
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
                  {mutation.isPending ? 'Saving…' : 'Create Recipient'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
