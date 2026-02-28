"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import Link from "next/link"
import { ArrowDownCircle, ArrowUpCircle, Users, Shield, Calendar, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface Tx {
  id: string
  delta: number
  reason: string
  metadata: any
  created_at: string
}

export default function CreditsAuditPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inspectingTx, setInspectingTx] = useState<Tx | null>(null)
  const [batchNames, setBatchNames] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Fetch batch names for transactions
    if (transactions.length > 0) {
      fetchBatchNames()
    }
  }, [transactions])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/institution/credits')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch')
      setBalance(typeof data.balance === 'number' ? data.balance : 0)
      setTransactions(data.transactions || [])
    } catch (err: any) {
      console.error('Failed to fetch credits', err)
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const fetchBatchNames = async () => {
    const batchIds = new Set<string>()
    transactions.forEach(tx => {
      if (tx.metadata?.batch_id) {
        batchIds.add(tx.metadata.batch_id)
      }
    })

    if (batchIds.size === 0) return

    try {
      const res = await fetch('/api/institution/batches')
      const data = await res.json()
      if (res.ok && data.batches) {
        const names: { [key: string]: string } = {}
        data.batches.forEach((batch: any) => {
          names[batch.id] = batch.name
        })
        setBatchNames(names)
      }
    } catch (err) {
      console.error('Failed to fetch batch names', err)
    }
  }

  const formatReason = (reason: string) => {
    const reasonMap: { [key: string]: string } = {
      'distribute_to_batch': 'Distributed to Batch',
      'super_admin_allocation': 'Admin Allocated',
      'refund': 'Refund',
      'adjustment': 'Adjustment',
      'initial_credit': 'Initial Credit'
    }
    return reasonMap[reason] || reason.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const formatMetadata = (tx: Tx) => {
    const { metadata, reason } = tx
    
    if (!metadata || Object.keys(metadata).length === 0) {
      return <span className="text-gray-400 text-sm">No details</span>
    }

    if (reason === 'distribute_to_batch') {
      const batchName = metadata.batch_id ? batchNames[metadata.batch_id] : null
      return (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-blue-600" />
            <span className="text-gray-700">
              Batch: <span className="font-medium">{batchName || 'Loading...'}</span>
            </span>
          </div>
          {metadata.per_member && (
            <div className="text-gray-600">
              {metadata.per_member} credits per member
            </div>
          )}
        </div>
      )
    }

    if (metadata.added_by === 'super_admin') {
      return (
        <div className="flex items-center gap-2 text-sm">
          <Shield className="w-3 h-3 text-purple-600" />
          <span className="text-gray-700">Added by Super Admin</span>
          {metadata.set_to !== null && metadata.set_to !== undefined && (
            <span className="text-gray-600">→ Set to {metadata.set_to}</span>
          )}
        </div>
      )
    }

    // Default: show key-value pairs
    return (
      <div className="text-sm text-gray-600 space-y-1">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key}>
            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}: </span>
            <span>{String(value)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Credit Transactions
            </h1>
            <p className="text-gray-600 mt-1">Audit trail and transaction history</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/institution-dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700">Refresh</Button>
          </div>
        </div>

        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader>
            <CardTitle className="text-blue-100">Current Balance</CardTitle>
            <CardDescription className="text-blue-200">Available institution credits</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-xl">Loading...</div>
            ) : error ? (
              <div className="text-sm text-red-200">{error}</div>
            ) : (
              <div className="text-5xl font-bold">{balance?.toLocaleString()} Credits</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent credit transactions with detailed information</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No transactions yet</p>
                <p className="text-sm mt-2">Transaction history will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="py-3 px-4 text-left font-semibold text-gray-900">Date & Time</th>
                      <th className="py-3 px-4 text-center font-semibold text-gray-900">Amount</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-900">Type</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-900">Details</th>
                      <th className="py-3 px-4 text-center font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{format(new Date(t.created_at), 'MMM dd, yyyy')}</div>
                            <div className="text-gray-500">{format(new Date(t.created_at), 'h:mm a')}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {t.delta < 0 ? (
                              <ArrowDownCircle className="w-4 h-4 text-red-600" />
                            ) : (
                              <ArrowUpCircle className="w-4 h-4 text-green-600" />
                            )}
                            <span className={`text-lg font-bold ${t.delta < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {t.delta > 0 ? '+' : ''}{t.delta.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            className={
                              t.delta < 0
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-green-100 text-green-700 border-green-200"
                            }
                          >
                            {formatReason(t.reason)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          {formatMetadata(t)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInspectingTx(t)}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details Modal */}
      <Dialog open={!!inspectingTx} onOpenChange={(open) => !open && setInspectingTx(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Transaction Details
            </DialogTitle>
            <DialogDescription>Complete information about this transaction</DialogDescription>
          </DialogHeader>

          {inspectingTx && (
            <div className="space-y-4">
              {/* Transaction ID */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                <p className="text-sm font-mono text-gray-900">{inspectingTx.id}</p>
              </div>

              {/* Main Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-600 mb-2">Amount</p>
                  <div className="flex items-center gap-2">
                    {inspectingTx.delta < 0 ? (
                      <ArrowDownCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <ArrowUpCircle className="w-5 h-5 text-green-600" />
                    )}
                    <p className={`text-2xl font-bold ${inspectingTx.delta < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {inspectingTx.delta > 0 ? '+' : ''}{inspectingTx.delta.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-gray-600 mb-2">Transaction Type</p>
                  <p className="text-lg font-semibold text-gray-900">{formatReason(inspectingTx.reason)}</p>
                </div>
              </div>

              {/* Date */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-gray-600 mb-2">Date & Time</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(inspectingTx.created_at), 'PPPP')} at {format(new Date(inspectingTx.created_at), 'h:mm a')}
                  </p>
                </div>
              </div>

              {/* Metadata Details */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-3">Additional Details</p>
                {inspectingTx.metadata && Object.keys(inspectingTx.metadata).length > 0 ? (
                  <div className="space-y-3">
                    {inspectingTx.reason === 'distribute_to_batch' && (
                      <>
                        {inspectingTx.metadata.batch_id && (
                          <div className="flex items-start gap-3">
                            <Users className="w-4 h-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Batch</p>
                              <p className="text-sm font-medium text-gray-900">
                                {batchNames[inspectingTx.metadata.batch_id] || inspectingTx.metadata.batch_id}
                              </p>
                            </div>
                          </div>
                        )}
                        {inspectingTx.metadata.per_member && (
                          <div className="flex items-start gap-3">
                            <ArrowUpCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Credits Per Member</p>
                              <p className="text-sm font-medium text-gray-900">{inspectingTx.metadata.per_member.toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                        {inspectingTx.metadata.performed_by && (
                          <div className="flex items-start gap-3">
                            <Shield className="w-4 h-4 text-purple-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Performed By</p>
                              <p className="text-sm font-mono text-gray-900">{inspectingTx.metadata.performed_by}</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {inspectingTx.metadata.added_by === 'super_admin' && (
                      <>
                        <div className="flex items-start gap-3">
                          <Shield className="w-4 h-4 text-purple-600 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Added By</p>
                            <p className="text-sm font-medium text-gray-900">Super Administrator</p>
                          </div>
                        </div>
                        {inspectingTx.metadata.set_to !== null && inspectingTx.metadata.set_to !== undefined && (
                          <div className="flex items-start gap-3">
                            <ArrowUpCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Balance Set To</p>
                              <p className="text-sm font-medium text-gray-900">{inspectingTx.metadata.set_to.toLocaleString()} credits</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Show all metadata as fallback */}
                    {inspectingTx.reason !== 'distribute_to_batch' && inspectingTx.metadata.added_by !== 'super_admin' && (
                      <div className="space-y-2">
                        {Object.entries(inspectingTx.metadata).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-3">
                            <div className="w-4 h-4 mt-0.5 bg-gray-400 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                              <p className="text-sm font-medium text-gray-900">{String(value)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No additional details available</p>
                )}
              </div>

              {/* Raw Data (Collapsible) */}
              <details className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                  View Raw Data (Technical)
                </summary>
                <div className="mt-3 p-3 bg-gray-900 rounded text-xs text-green-400 font-mono overflow-x-auto">
                  <pre>{JSON.stringify(inspectingTx, null, 2)}</pre>
                </div>
              </details>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
