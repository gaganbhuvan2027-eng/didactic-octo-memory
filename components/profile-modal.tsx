"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function ProfileModal({ children, triggerClassName = "", triggerText = "Manage my profile" }: { children?: React.ReactNode; triggerClassName?: string; triggerText?: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (open) fetchProfile()
  }, [open])

  async function fetchProfile() {
    setLoading(true)
    try {
      const res = await fetch("/api/profile")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast({ title: "Error", description: data?.error || "Failed to load profile" })
        return
      }
      const data = await res.json()
      setProfile(data)
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Failed to load profile" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="ghost" className={triggerClassName}>{triggerText}</Button>
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
          <DialogDescription>Quick view of your profile and institute membership.</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading && <div className="text-sm text-gray-500">Loading...</div>}
          {!loading && !profile && <div className="text-sm text-gray-500">No profile data</div>}

          {!loading && profile && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{profile.name || profile.email?.split("@")[0] || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Institute</p>
                <p className="font-medium">{profile.institution_id ? "Joined" : "Not joined"}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={() => { setOpen(false); router.push('/profile') }}>Open full profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
