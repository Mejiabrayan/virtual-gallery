"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Tables } from '@/database.types'

// Use the database types
type FramePosition = Tables<'frame_positions'>

interface ImageUploadProps {
  onSuccess?: () => void
}

export default function ImageUpload({ onSuccess }: ImageUploadProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [availableFrames, setAvailableFrames] = useState<FramePosition[]>([])
  const [selectedFrame, setSelectedFrame] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Get user ID from local storage and fetch frame positions
  useEffect(() => {
    const savedUserId = localStorage.getItem('gallery_user_id')
    if (savedUserId) {
      setUserId(savedUserId)
      fetchGalleryData()
    }
  }, [])
  
  const fetchGalleryData = async () => {
    try {
      const response = await fetch('/api/gallery/data')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch gallery data')
      }
      
      // Filter out frames that already have images
      const usedFrameIds = (data.images || []).map((img: { frame_id: string }) => img.frame_id)
      const available = (data.framePositions || []).filter(
        (frame: FramePosition) => !usedFrameIds.includes(frame.id)
      )
      setAvailableFrames(available)
      
    } catch (error) {
      console.error('Error fetching gallery data:', error)
      toast({
        title: "Error",
        description: "Failed to load gallery data. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file",
          description: "Please select a valid image file (JPEG, PNG, GIF, WEBP).",
          variant: "destructive"
        })
        return
      }
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB.",
          variant: "destructive"
        })
        return
      }
      
      setFile(selectedFile)
      const preview = URL.createObjectURL(selectedFile)
      setPreviewUrl(preview)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId) {
      toast({
        title: "Not logged in",
        description: "Please join the gallery first to get a user ID.",
        variant: "destructive"
      })
      return
    }
    
    if (!selectedFrame) {
      toast({
        title: "No frame selected",
        description: "Please select a frame position for your image.",
        variant: "destructive"
      })
      return
    }
    
    if (!file) {
      toast({
        title: "No image selected",
        description: "Please select an image to upload.",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsLoading(true)
      
      const formData = new FormData()
      formData.append('userId', userId)
      formData.append('frameId', selectedFrame)
      formData.append('file', file)
      
      const response = await fetch('/api/gallery/image', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }
      
      // Clear form
      setFile(null)
      setPreviewUrl(null)
      setSelectedFrame("")
      
      // Update available frames
      fetchGalleryData()
      
      toast({
        title: "Upload successful!",
        description: "Your image has been added to the gallery."
      })
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
      
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])
  
  if (!userId) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Join the Gallery First</CardTitle>
          <CardDescription>
            You need to join the gallery to upload images
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p>Please use the Join Gallery button to get a unique user ID first.</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Upload Your Artwork</CardTitle>
        <CardDescription>
          Choose a frame position and upload your image
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Frame Position</label>
            <Select value={selectedFrame} onValueChange={setSelectedFrame}>
              <SelectTrigger>
                <SelectValue placeholder="Select a frame position" />
              </SelectTrigger>
              <SelectContent>
                {availableFrames.length === 0 ? (
                  <SelectItem value="none" disabled>No frames available</SelectItem>
                ) : (
                  availableFrames.map((frame) => (
                    <SelectItem key={frame.id} value={frame.id}>
                      {frame.id === 'center' ? 'Featured Center (Large frame, back wall center)' :
                       frame.id === 'backLeft' ? 'Back Wall Left (Next to featured frame)' :
                       frame.id === 'backRight' ? 'Back Wall Right (Next to featured frame)' :
                       frame.id === 'leftWall1' ? 'Left Wall Front (Near entrance)' :
                       frame.id === 'leftWall2' ? 'Left Wall Back (Near back wall)' :
                       frame.id === 'rightWall1' ? 'Right Wall Front (Near entrance)' :
                       'Right Wall Back (Near back wall)'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              <input
                type="file"
                id="image"
                className="sr-only"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label
                htmlFor="image"
                className="cursor-pointer block w-full text-center"
              >
                {previewUrl ? (
                  <div className="space-y-2">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mx-auto max-h-40 object-contain"
                    />
                    <span className="text-sm text-blue-500">Change image</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="block text-gray-500">
                      Click to select an image
                    </span>
                    <span className="text-xs text-gray-400">
                      JPG, PNG, GIF, WEBP (Max 5MB)
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading || !selectedFrame || !file}
        >
          {isLoading ? "Uploading..." : "Upload to Gallery"}
        </Button>
      </CardFooter>
    </Card>
  )
} 