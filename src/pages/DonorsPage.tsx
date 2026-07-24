import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/AuthContext'
import { donorsApi, type DonorCreate } from '@/api/donors'
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

const TYPE_LABELS = {
  individual: 'Individual',
  business: 'Business',
  org: 'Organization',
} as const

const donorFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['individual', 'business', 'org']),
  email: z.union([z.literal(''), z.string().email('Invalid email address')]),
  phone: z.string(),
  tax_id: z.string(),
})

type DonorFormValues = z.infer<typeof donorFormSchema>

const emptyForm: DonorFormValues = {
  name: '',
  type: 'individual',
  email: '',
  phone: '',
  tax_id: '',
}

export function DonorsPage() {
  const { fetchWithAuth } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<DonorFormValues>({
    resolver: zodResolver(donorFormSchema),
    defaultValues: emptyForm,
  })

  const { data: donors, isLoading, error } = useQuery({
    queryKey: ['donors'],
    queryFn: () => donorsApi.list(fetchWithAuth),
  })

  const mutation = useMutation({
    mutationFn: (body: DonorCreate) => donorsApi.create(fetchWithAuth, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['donors'] })
      closeDialog()
    },
  })

  function closeDialog() {
    setDialogOpen(false)
    form.reset(emptyForm)
    mutation.reset()
  }

  function onSubmit(values: DonorFormValues) {
    const body: DonorCreate = {
      name: values.name,
      type: values.type,
      ...(values.email ? { email: values.email } : {}),
      ...(values.phone ? { phone: values.phone } : {}),
      ...(values.tax_id ? { tax_id: values.tax_id } : {}),
    }
    mutation.mutate(body)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Donors</h1>
        <Button onClick={() => setDialogOpen(true)}>+ New Donor</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Failed to load donors: {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                Loading donors…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && donors?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                No donors yet. Add one to get started.
              </TableCell>
            </TableRow>
          )}
          {donors?.map(donor => (
            <TableRow
              key={donor.donor_id}
              onClick={() => navigate(`/dashboard/donors/${donor.donor_id}`)}
              className="cursor-pointer"
            >
              <TableCell className="font-medium">{donor.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{TYPE_LABELS[donor.type]}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{donor.email ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">{donor.phone ?? '—'}</TableCell>
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
            <DialogTitle>New Donor</DialogTitle>
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
                      <Input placeholder="Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
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
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="org">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" {...field} />
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
                name="tax_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID</FormLabel>
                    <FormControl>
                      <Input placeholder="12-3456789" {...field} />
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
                  {mutation.isPending ? 'Saving…' : 'Create Donor'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
