"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export default function UploadMembersModal({ triggerClassName = "", triggerText = "Upload List" }: { triggerClassName?: string; triggerText?: string }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [preview, setPreview] = useState<any | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    setPastedText("") // Clear pasted text when file is selected
    setResult(null)
    setPreview(null)
  }

  const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPastedText(e.target.value)
    setFile(null) // Clear file when text is pasted
    setResult(null)
    setPreview(null)
  }

  const handlePreview = async () => {
    if (!file && !pastedText.trim()) {
      toast({ title: "No input", description: "Please upload a file or paste emails." })
      return
    }

    try {
      setLoading(true)
      
      let res
      if (pastedText.trim()) {
        // Create a text file from pasted content
        const blob = new Blob([pastedText], { type: 'text/plain' })
        const textFile = new File([blob], 'pasted-emails.txt', { type: 'text/plain' })
        const form = new FormData()
        form.append("file", textFile)

        res = await fetch("/api/institution/members/upload?preview=1", {
          method: "POST",
          body: form,
        })
      } else if (file) {
        const form = new FormData()
        form.append("file", file)

        res = await fetch("/api/institution/members/upload?preview=1", {
          method: "POST",
          body: form,
        })
      }

      if (!res) return

      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Preview failed", description: data.error || "Unable to parse input" })
        return
      }

      setPreview(data)
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Preview failed. Try again." })
    } finally {
      setLoading(false)
    }
  }

  const handleAddConfirmed = async () => {
    if (!file && !pastedText.trim()) {
      toast({ title: "No input", description: "Please upload a file or paste emails." })
      return
    }

    try {
      setLoading(true)
      
      let res
      if (pastedText.trim()) {
        // Create a text file from pasted content
        const blob = new Blob([pastedText], { type: 'text/plain' })
        const textFile = new File([blob], 'pasted-emails.txt', { type: 'text/plain' })
        const form = new FormData()
        form.append("file", textFile)

        res = await fetch("/api/institution/members/upload", {
          method: "POST",
          body: form,
        })
      } else if (file) {
        const form = new FormData()
        form.append("file", file)

        res = await fetch("/api/institution/members/upload", {
          method: "POST",
          body: form,
        })
      }

      if (!res) return

      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Upload failed", description: data.error || "Unable to process input" })
        return
      }

      setResult(data)
      toast({ title: "Upload complete", description: `${data.added?.length || 0} members added.` })

      // Refresh members view in the dashboard
      setTimeout(() => {
        setOpen(false)
        setPastedText("")
        setFile(null)
        setPreview(null)
        setResult(null)
        router.refresh()
      }, 800)
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Upload failed. Try again." })
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

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
          <DialogDescription>Upload a file or paste emails to add multiple members at once.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste">Paste Emails</TabsTrigger>
            <TabsTrigger value="file">Upload File</TabsTrigger>
          </TabsList>
          
          <TabsContent value="paste" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="paste-emails">Paste Emails</Label>
              <Textarea
                id="paste-emails"
                placeholder="Paste emails here (one per line or separated by commas, spaces, etc.)&#10;&#10;Example:&#10;user1@example.com&#10;user2@example.com&#10;user3@example.com"
                value={pastedText}
                onChange={onTextChange}
                rows={10}
                className="font-mono text-sm"
              />
              {pastedText && (
                <p className="text-sm text-gray-600">
                  {pastedText.split('\n').filter(line => line.trim()).length} lines entered
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="upload-file">Upload File</Label>
              <Input 
                id="upload-file" 
                type="file" 
                accept=".csv, .txt, .xlsx, .xls, application/pdf, .pdf, text/plain" 
                onChange={onFileChange} 
              />
              {file && <p className="text-sm text-gray-600">Selected: {file.name}</p>}
              <p className="text-xs text-gray-500">Supported formats: TXT, CSV, Excel (.xlsx/.xls), PDF</p>
            </div>
          </TabsContent>
        </Tabs>

        {preview && (
          <div className="mt-4 border p-3 rounded">
            <p className="text-sm">Found in DB: <strong>{preview.found?.length || 0}</strong></p>
            {preview.found && preview.found.length > 0 && (
              <ul className="pl-4 list-disc text-sm text-gray-700 max-h-40 overflow-auto">
                {preview.found.map((e: string) => <li key={e}>{e}</li>)}
              </ul>
            )}
            <p className="text-sm mt-2">Not found: <strong>{preview.notFound?.length || 0}</strong></p>
            {preview.notFound && preview.notFound.length > 0 && (
              <ul className="pl-4 list-disc text-sm text-gray-700 max-h-40 overflow-auto">
                {preview.notFound.map((e: string) => <li key={e}>{e}</li>)}
              </ul>
            )}
            <p className="text-sm mt-2">Already members: <strong>{preview.alreadyMembers?.length || 0}</strong></p>
            {preview.alreadyMembers && preview.alreadyMembers.length > 0 && (
              <ul className="pl-4 list-disc text-sm text-gray-700 max-h-40 overflow-auto">
                {preview.alreadyMembers.map((e: string) => <li key={e}>{e}</li>)}
              </ul>
            )}
            <div className="mt-3 flex gap-2">
              <Button variant="outline" onClick={() => { setPreview(null); setResult(null); setFile(null); setPastedText(""); }}>Clear</Button>
              <Button onClick={handleAddConfirmed} disabled={loading}>{loading ? "Adding..." : "Add Found Users"}</Button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-4">
            <p className="text-sm">Added: <strong>{result.added?.length || 0}</strong></p>
            {result.added && result.added.length > 0 && (
              <ul className="pl-4 list-disc text-sm text-gray-700 max-h-40 overflow-auto">
                {result.added.map((e: string) => <li key={e}>{e}</li>)}
              </ul>
            )}
            <p className="text-sm mt-2">Not found: <strong>{result.notFound?.length || 0}</strong></p>
            {result.notFound && result.notFound.length > 0 && (
              <ul className="pl-4 list-disc text-sm text-gray-700 max-h-40 overflow-auto">
                {result.notFound.map((e: string) => <li key={e}>{e}</li>)}
              </ul>
            )}
            <p className="text-sm mt-2">Skipped/Duplicate: <strong>{result.skipped?.length || 0}</strong></p>
            {result.skipped && result.skipped.length > 0 && (
              <ul className="pl-4 list-disc text-sm text-gray-700 max-h-40 overflow-auto">
                {result.skipped.map((s: any, i: number) => <li key={`${s.email}-${i}`}>{s.email} — {s.reason}</li>)}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          {!preview && <Button onClick={handlePreview} disabled={loading}>{loading ? "Parsing..." : "Preview"}</Button>}
          {preview && <Button onClick={handleAddConfirmed} disabled={loading}>{loading ? "Adding..." : "Add Found Users"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
