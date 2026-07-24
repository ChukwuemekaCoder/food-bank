import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { inventoryItemsApi } from '@/api/inventory-items'
import {
  getExpirationUrgency,
  formatExpirationDetail,
  EXPIRATION_URGENCY_CLASSNAME,
} from '@/lib/expiration'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardTitle } from '@/components/ui/card'

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

export function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { fetchWithAuth } = useAuth()

  const {
    data: item,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: () => inventoryItemsApi.get(fetchWithAuth, id!),
    enabled: !!id,
  })

  const urgency = item ? getExpirationUrgency(item.expiration_date) : 'none'

  return (
    <div className="p-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        nativeButton={false}
        render={<Link to="/dashboard/inventory" />}
      >
        <ArrowLeftIcon />
        Back to Inventory
      </Button>

      <Card>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load inventory item: {(error as Error).message}
              </AlertDescription>
            </Alert>
          )}
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {item && (
            <>
              <div className="flex items-start justify-between mb-4">
                <CardTitle className="text-2xl">
                  {item.description || CATEGORY_LABELS[item.category]}
                </CardTitle>
                <Badge variant="outline" className={statusBadgeClassName(item.status)}>
                  {item.status}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoField label="Category" value={CATEGORY_LABELS[item.category]} />
                <InfoField label="Quantity" value={`${item.quantity} ${item.unit}`} />
                <InfoField label="Storage Location" value={item.storage_location} />
                <InfoField
                  label="Expiration"
                  value={
                    item.expiration_date ? (
                      <span className={EXPIRATION_URGENCY_CLASSNAME[urgency]}>
                        {new Date(item.expiration_date).toLocaleDateString()} ·{' '}
                        {formatExpirationDetail(item.expiration_date)}
                      </span>
                    ) : null
                  }
                />
                <InfoField label="Donation ID" value={item.donation_id} />
                <InfoField
                  label="Added"
                  value={new Date(item.created_at).toLocaleDateString()}
                />
              </dl>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
