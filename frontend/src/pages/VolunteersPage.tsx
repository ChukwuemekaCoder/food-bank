import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/AuthContext'
import { volunteersApi, type VolunteerCreate } from '@/api/volunteers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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

function YesNoBadge({ value }: { value: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        value
          ? 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
          : 'border-transparent bg-muted text-muted-foreground'
      }
    >
      {value ? 'Yes' : 'No'}
    </Badge>
  )
}

const volunteerFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.union([z.literal(''), z.string().email('Invalid email address')]),
  phone: z.string(),
  can_drive: z.boolean(),
  certifications: z.string(),
})

type VolunteerFormValues = z.infer<typeof volunteerFormSchema>

const emptyForm: VolunteerFormValues = {
  name: '',
  email: '',
  phone: '',
  can_drive: false,
  certifications: '',
}

export function VolunteersPage() {
  const { fetchWithAuth } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<VolunteerFormValues>({
    resolver: zodResolver(volunteerFormSchema),
    defaultValues: emptyForm,
  })

  const { data: volunteers, isLoading, error } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => volunteersApi.list(fetchWithAuth),
  })

  const mutation = useMutation({
    mutationFn: (body: VolunteerCreate) => volunteersApi.create(fetchWithAuth, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['volunteers'] })
      closeDialog()
    },
  })

  function closeDialog() {
    setDialogOpen(false)
    form.reset(emptyForm)
    mutation.reset()
  }

  function onSubmit(values: VolunteerFormValues) {
    const body: VolunteerCreate = {
      name: values.name,
      can_drive: values.can_drive,
      ...(values.email ? { email: values.email } : {}),
      ...(values.phone ? { phone: values.phone } : {}),
      ...(values.certifications ? { certifications: values.certifications } : {}),
    }
    mutation.mutate(body)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Volunteers</h1>
        <Button onClick={() => setDialogOpen(true)}>+ New Volunteer</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Failed to load volunteers: {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Can Drive</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                Loading volunteers…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && volunteers?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                No volunteers yet. Add one to get started.
              </TableCell>
            </TableRow>
          )}
          {volunteers?.map(volunteer => (
            <TableRow
              key={volunteer.volunteer_id}
              onClick={() => navigate(`/dashboard/volunteers/${volunteer.volunteer_id}`)}
              className="cursor-pointer"
            >
              <TableCell className="font-medium">{volunteer.name}</TableCell>
              <TableCell className="text-muted-foreground">{volunteer.email ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">{volunteer.phone ?? '—'}</TableCell>
              <TableCell>
                <YesNoBadge value={volunteer.can_drive} />
              </TableCell>
              <TableCell>
                <YesNoBadge value={volunteer.active} />
              </TableCell>
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
            <DialogTitle>New Volunteer</DialogTitle>
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
                      <Input placeholder="Jane Driver" {...field} />
                    </FormControl>
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
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications</FormLabel>
                    <FormControl>
                      <Input placeholder="Food Handler" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="can_drive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={checked => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Can drive</FormLabel>
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
                  {mutation.isPending ? 'Saving…' : 'Create Volunteer'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
