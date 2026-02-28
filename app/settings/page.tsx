"use client"

import { useState, useEffect } from "react"
import DashboardNavbar from "@/components/dashboard-navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Check, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    autoSave: true,
    soundEnabled: true,
    dataCollection: true,
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-lg text-gray-600">Manage your preferences and account settings.</p>
        </div>

        {/* Notification Settings */}
        <Card className="p-8 mb-6 border-0 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={() => handleToggle("emailNotifications")}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-600">Receive browser notifications</p>
              </div>
              <Switch checked={settings.pushNotifications} onCheckedChange={() => handleToggle("pushNotifications")} />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Sound Enabled</p>
                <p className="text-sm text-gray-600">Play sounds during interviews</p>
              </div>
              <Switch checked={settings.soundEnabled} onCheckedChange={() => handleToggle("soundEnabled")} />
            </div>
          </div>
        </Card>

        {/* Appearance Settings */}
        <Card className="p-8 mb-6 border-0 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Appearance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-600">Use dark theme (coming soon)</p>
              </div>
              <Switch checked={settings.darkMode} onCheckedChange={() => handleToggle("darkMode")} disabled />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Auto-save Progress</p>
                <p className="text-sm text-gray-600">Automatically save your progress</p>
              </div>
              <Switch checked={settings.autoSave} onCheckedChange={() => handleToggle("autoSave")} />
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-8 mb-6 border-0 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Privacy</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Data Collection</p>
                <p className="text-sm text-gray-600">Allow us to collect usage data</p>
              </div>
              <Switch checked={settings.dataCollection} onCheckedChange={() => handleToggle("dataCollection")} />
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-8 border-0 shadow-sm border-l-4 border-l-red-500">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Danger Zone</h3>
          <div className="space-y-4">
            <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50 bg-transparent">
              Download My Data
            </Button>
            <div className="w-full px-4 py-3 border border-dashed border-red-200 rounded-lg text-red-500 text-sm bg-red-50">
              Account deletion is disabled for this MVP release.
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
