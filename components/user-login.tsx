"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserLoginProps {
  onLogin: (userId: string) => void
  currentUser: string
  isLoggedIn: boolean
}

export default function UserLogin({ onLogin, currentUser, isLoggedIn }: UserLoginProps) {
  const [userId, setUserId] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userId.trim()) {
      onLogin(userId.trim())
    }
  }

  if (isLoggedIn) {
    return (
      <div className="py-4 text-center">
        <p className="mb-4">You are currently identified as:</p>
        <div className="bg-muted p-3 rounded-md mb-4 font-medium text-lg">{currentUser}</div>
        <p className="text-sm text-muted-foreground mb-4">
          Note: This is just a simple user identifier, not actual authentication.
        </p>
        <Button variant="outline" className="w-full" onClick={() => onLogin("admin")}>
          Switch to Admin
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="py-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="user-id">Choose a User ID</Label>
          <Input
            id="user-id"
            placeholder="Enter any name or ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">This is just a simple identifier, not actual authentication.</p>
        </div>
        <Button type="submit" className="w-full">
          Continue as this User
        </Button>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Or use the admin identifier to manage featured images</p>
          <Button variant="link" className="p-0 h-auto" onClick={() => onLogin("admin")}>
            Continue as Admin
          </Button>
        </div>
      </div>
    </form>
  )
}

