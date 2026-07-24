import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/AuthContext'
import { routesApi, type RouteCreate } from '@/api/routes'
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

const routeFormSchema = z.object({
  route_date: z.string().min(1, 'Date is required'),
  status: z.string().min(1, 'Status is required'),
  vehicle: z.string(),
})

type RouteFormValues = z.infer<typeof routeFormSchema>

const emptyForm: RouteFormValues = {
  route_date: '',
  status: 'planned',
  vehicle: '',
}

export function RoutesPage() {
  const { fetchWithAuth } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: emptyForm,
  })

  const { data: routes, isLoading, error } = useQuery({
    queryKey: ['routes'],
    queryFn: () => routesApi.list(fetchWithAuth),
  })

  const mutation = useMutation({
    mutationFn: (body: RouteCreate) => routesApi.create(fetchWithAuth, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['routes'] })
      closeDialog()
    },
  })

  function closeDialog() {
    setDialogOpen(false)
    form.reset(emptyForm)
    mutation.reset()
  }

  function onSubmit(values: RouteFormValues) {
    const body: RouteCreate = {
      route_date: values.route_date,
      status: values.status,
      ...(values.vehicle ? { vehicle: values.vehicle } : {}),
    }
    mutation.mutate(body)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Routes</h1>
        <Button onClick={() => setDialogOpen(true)}>+ New Route</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Failed to load routes: {(error as Error).message}</AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Route Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vehicle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                Loading routes…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && routes?.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                No routes yet. Add one to get started.
              </TableCell>
            </TableRow>
          )}
          {routes?.map(route => (
            <TableRow
              key={route.route_id}
              onClick={() => navigate(`/dashboard/routes/${route.route_id}`)}
              className="cursor-pointer"
            >
              <TableCell className="font-medium">
                {new Date(route.route_date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{route.status}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{route.vehicle ?? '—'}</TableCell>
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
            <DialogTitle>New Route</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="route_date"
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

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Status <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="planned" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <FormControl>
                      <Input placeholder="Van 2" {...field} />
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
                  {mutation.isPending ? 'Saving…' : 'Create Route'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
