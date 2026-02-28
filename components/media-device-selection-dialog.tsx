"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export interface MediaDevice {
  deviceId: string
  label: string
  kind: "videoinput" | "audioinput"
}

interface MediaDeviceSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentVideoId?: string | null
  currentAudioId?: string | null
  onDevicesChange?: (videoId: string | null, audioId: string | null) => void
  showVideo?: boolean
  showAudio?: boolean
}

export function MediaDeviceSelectionDialog({
  open,
  onOpenChange,
  currentVideoId,
  currentAudioId,
  onDevicesChange,
  showVideo = true,
  showAudio = true,
}: MediaDeviceSelectionDialogProps) {
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState<string>(currentVideoId || "")
  const [selectedAudioId, setSelectedAudioId] = useState<string>(currentAudioId || "")
  const [loading, setLoading] = useState(false)

  const enumerateDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    setLoading(true)
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videos = devices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 8)}`, kind: "videoinput" as const }))
      const audios = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`, kind: "audioinput" as const }))
      setVideoDevices(videos)
      setAudioDevices(audios)
      if (videos.length > 0 && !selectedVideoId) setSelectedVideoId(videos[0].deviceId)
      if (audios.length > 0 && !selectedAudioId) setSelectedAudioId(audios[0].deviceId)
    } catch (err) {
      console.error("Error enumerating devices:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      enumerateDevices()
    }
  }, [open])

  useEffect(() => {
    setSelectedVideoId(currentVideoId || "")
    setSelectedAudioId(currentAudioId || "")
  }, [currentVideoId, currentAudioId, open])

  const handleApply = () => {
    onDevicesChange?.(
      selectedVideoId || null,
      selectedAudioId || null
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Media Device Selection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {showVideo && (
            <div className="space-y-2">
              <Label>Select camera</Label>
              <Select
                value={selectedVideoId}
                onValueChange={setSelectedVideoId}
                disabled={loading || videoDevices.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Change camera" />
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {showAudio && (
            <div className="space-y-2">
              <Label>Select microphone</Label>
              <Select
                value={selectedAudioId}
                onValueChange={setSelectedAudioId}
                disabled={loading || audioDevices.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Change microphone" />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="text-xs text-gray-500 pt-2">
            Note: You have the option to delete your video recording after interview completion.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
