"use client"

import { useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import streams from "@/lib/courses"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function AddCoursesModal({ batchId, triggerClassName = "", triggerText = "Create Content", onSuccess }: { batchId: string; triggerClassName?: string; triggerText?: string; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const toggle = (id: string) => {
    const ns = new Set(selected)
    if (ns.has(id)) ns.delete(id)
    else ns.add(id)
    setSelected(ns)
  }

  const filteredStreams = streams.map((s: any) => ({
    ...s,
    subcourses: s.subcourses.filter((sc: any) => sc.name.toLowerCase().includes(query.toLowerCase()) || sc.id.toLowerCase().includes(query.toLowerCase())),
  })).filter((s: any) => s.subcourses.length > 0)

  const handleAdd = async () => {
    if (selected.size === 0) {
      toast({ title: "Select courses", description: "Please select at least one course to add." })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/institution/batches/${batchId}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: "Failed to add courses", description: data.error || "Server error" })
        return
      }

      toast({ title: "Courses added", description: `${data.inserted || 0} course(s) added to batch` })
      setOpen(false)
      setSelected(new Set())
      if (onSuccess) onSuccess()
      else router.refresh()
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Failed to add courses. Try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName} onClick={() => setOpen(true)}>
          {triggerText}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Courses to Batch</DialogTitle>
          <DialogDescription>Select courses to add as content for this batch</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Input placeholder="Search courses..." value={query} onChange={(e: any) => setQuery(e.target.value)} />
        </div>

        <div className="max-h-96 overflow-y-auto grid gap-3 py-2">
          {filteredStreams.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No courses found</p>
          ) : (
            filteredStreams.map((s: any) => (
              <div key={s.id} className="border rounded p-3">
                <h3 className="font-medium mb-2">{s.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {s.subcourses.map((sc: any) => (
                    <div key={sc.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer" onClick={() => toggle(sc.id)}>
                      <Checkbox checked={selected.has(sc.id)} onCheckedChange={() => toggle(sc.id)} />
                      <div>
                        <p className="font-medium">{sc.name}</p>
                        <p className="text-sm text-gray-500">{sc.info}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); setSelected(new Set()) }}>Cancel</Button>
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? "Adding..." : `Add ${selected.size} Course(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
