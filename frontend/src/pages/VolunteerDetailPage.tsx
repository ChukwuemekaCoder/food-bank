import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { volunteersApi } from '@/api/volunteers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardTitle } from '@/components/ui/card'

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

export function VolunteerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { fetchWithAuth } = useAuth()

  const {
    data: volunteer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['volunteer', id],
    queryFn: () => volunteersApi.get(fetchWithAuth, id!),
    enabled: !!id,
  })

  return (
    <div className="p-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        nativeButton={false}
        render={<Link to="/dashboard/volunteers" />}
      >
        <ArrowLeftIcon />
        Back to Volunteers
      </Button>

      <Card>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load volunteer: {(error as Error).message}
              </AlertDescription>
            </Alert>
          )}
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {volunteer && (
            <>
              <div className="flex items-start justify-between mb-4">
                <CardTitle className="text-2xl">{volunteer.name}</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    volunteer.active
                      ? 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                      : 'border-transparent bg-muted text-muted-foreground'
                  }
                >
                  {volunteer.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InfoField label="Email" value={volunteer.email} />
                <InfoField label="Phone" value={volunteer.phone} />
                <InfoField label="Can Drive" value={<YesNoBadge value={volunteer.can_drive} />} />
                <InfoField label="Certifications" value={volunteer.certifications} />
              </dl>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
