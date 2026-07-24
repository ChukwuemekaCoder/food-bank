import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { donorsApi } from '@/api/donors'
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

const TYPE_LABELS = {
  individual: 'Individual',
  business: 'Business',
  org: 'Organization',
} as const

const DONATION_TYPE_LABELS = {
  food: 'Food',
  funds: 'Funds',
  goods: 'Goods',
} as const

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{value ?? '—'}</dd>
    </div>
  )
}

export function DonorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { fetchWithAuth } = useAuth()

  const {
    data: donor,
    isLoading: donorLoading,
    error: donorError,
  } = useQuery({
    queryKey: ['donor', id],
    queryFn: () => donorsApi.get(fetchWithAuth, id!),
    enabled: !!id,
  })

  const {
    data: donations,
    isLoading: donationsLoading,
    error: donationsError,
  } = useQuery({
    queryKey: ['donor', id, 'donations'],
    queryFn: () => donorsApi.donations(fetchWithAuth, id!),
    enabled: !!id,
  })

  return (
    <div className="p-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        nativeButton={false}
        render={<Link to="/dashboard/donors" />}
      >
        <ArrowLeftIcon />
        Back to Donors
      </Button>

      <Card className="mb-6">
        <CardContent>
          {donorError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load donor: {(donorError as Error).message}
              </AlertDescription>
            </Alert>
          )}
          {donorLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {donor && (
            <>
              <div className="flex items-start justify-between mb-4">
                <CardTitle className="text-2xl">{donor.name}</CardTitle>
                <Badge variant="secondary">{TYPE_LABELS[donor.type]}</Badge>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InfoField label="Email" value={donor.email} />
                <InfoField label="Phone" value={donor.phone} />
                <InfoField label="Tax ID" value={donor.tax_id} />
                <InfoField
                  label="Member since"
                  value={new Date(donor.created_at).toLocaleDateString()}
                />
              </dl>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Donations</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Est. Value</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donationsLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Loading donations…
                  </TableCell>
                </TableRow>
              )}
              {donationsError && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-destructive text-sm">
                    Failed to load donations: {(donationsError as Error).message}
                  </TableCell>
                </TableRow>
              )}
              {!donationsLoading && donations?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No donations recorded.
                  </TableCell>
                </TableRow>
              )}
              {donations?.map(d => (
                <TableRow key={d.donation_id}>
                  <TableCell className="pl-4">
                    {new Date(d.received_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{DONATION_TYPE_LABELS[d.donation_type]}</TableCell>
                  <TableCell>
                    {d.estimated_value != null ? `$${Number(d.estimated_value).toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.notes ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
