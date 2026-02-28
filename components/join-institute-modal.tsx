"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function JoinInstituteModal({
  triggerClassName = "",
  triggerText = "Join Institute",
}: {
  triggerClassName?: string
  triggerText?: string
}) {
  const [open, setOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const router = useRouter()

  const handleJoin = async () => {
    const code = inviteCode.trim()
    if (!code) {
      toast({ title: "Enter an invite code", description: "Please provide a valid invite code.", })
      return
    }

    try {
      setLoading(true)

      const res = await fetch("/api/institution/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Failed to join", description: data?.error || "Invalid invite code." })
        return
      }

      toast({ title: `Joined ${data.institutionName}`, description: "You are now a member of the institution." })

      // Close modal and reset
      setOpen(false)
      setInviteCode("")

      // Refresh to update user/institution state
      router.refresh()
    } catch (err) {
      console.error("Error joining institution:", err)
      toast({ title: "Error", description: "Could not join institution. Try again later." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className={triggerClassName} onClick={() => setOpen(true)}>
          {triggerText}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join an Institution</DialogTitle>
          <DialogDescription>Enter an invite code to join your institution.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          <Label htmlFor="invite-code">Invite Code</Label>
          <Input
            id="invite-code"
            placeholder="e.g. ABC123"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleJoin} disabled={loading}>
            {loading ? "Joining..." : "Join"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
