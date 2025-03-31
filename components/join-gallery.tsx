"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export default function JoinGallery() {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Check if user ID exists in local storage
  useEffect(() => {
    const savedUserId = localStorage.getItem('gallery_user_id')
    if (savedUserId) {
      setUserId(savedUserId)
    }
  }, [])
  
  const handleJoin = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/gallery/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join gallery')
      }
      
      // Save user ID to local storage
      localStorage.setItem('gallery_user_id', data.userId)
      setUserId(data.userId)
      
      toast({
        title: "Welcome to the gallery!",
        description: `Your unique ID is: ${data.userId}. Remember this ID to access your uploads.`
      })
      
    } catch (error) {
      console.error('Error joining gallery:', error)
      toast({
        title: "Error",
        description: "Failed to join the gallery. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const copyToClipboard = () => {
    if (userId) {
      navigator.clipboard.writeText(userId)
      toast({
        title: "Copied!",
        description: "User ID copied to clipboard."
      })
    }
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome to the Virtual Gallery</CardTitle>
        <CardDescription>
          Join our collaborative virtual gallery to showcase your artwork
        </CardDescription>
      </CardHeader>
      <CardContent>
        {userId ? (
          <div className="text-center">
            <p className="mb-2">Your unique gallery ID:</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <code className="bg-muted p-2 rounded">{userId}</code>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                Copy
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Save this ID to access or update your uploads later.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4">
              To participate in our gallery, click below to get your unique ID.
              You&apos;ll use this ID to upload and manage your artwork.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        {!userId && (
          <Button onClick={handleJoin} disabled={isLoading}>
            {isLoading ? "Joining..." : "Join the Gallery"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 