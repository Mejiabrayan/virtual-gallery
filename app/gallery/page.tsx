"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import JoinGallery from "@/components/join-gallery"
import ImageUpload from "@/components/image-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Tables } from '@/database.types'

// Frame position and gallery image types
type FramePosition = Tables<'frame_positions'>

interface GalleryImage {
  url: string
  featured: boolean
  userId: string
  frameId: string
}

// Dynamically import the ArtGallery component to avoid SSR issues with Three.js
const ArtGallery = dynamic(() => import("@/components/art-gallery"), {
  ssr: false,
  loading: () => (
    <div className="h-[75vh] flex items-center justify-center bg-gray-900">
      <div className="text-xl text-white font-bold">Loading 3D Gallery...</div>
    </div>
  ),
})

export default function GalleryPage() {
  const [galleryData, setGalleryData] = useState<{
    images: GalleryImage[]
    framePositions: FramePosition[]
  }>({
    images: [],
    framePositions: [],
  })
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("gallery")

  // Check if user ID exists in local storage
  useEffect(() => {
    const savedUserId = localStorage.getItem("gallery_user_id")
    if (savedUserId) {
      setUserId(savedUserId)
    }
  }, [])

  // Handle successful join
  const handleJoinSuccess = (newUserId: string) => {
    setUserId(newUserId)
    localStorage.setItem("gallery_user_id", newUserId)
    setActiveTab("gallery") // Switch back to gallery view
  }

  // Fetch gallery data
  const fetchGalleryData = async () => {
    try {
      setLoading(true)
      console.log("Fetching gallery data...")
      
      const response = await fetch("/api/gallery/data")
      const data = await response.json()

      console.log("Gallery data received:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch gallery data")
      }

      // Make sure we have at least empty arrays
      setGalleryData({
        images: data.images || [],
        framePositions: data.framePositions || [],
      })
      
      console.log("Gallery data set:", {
        images: data.images || [],
        framePositions: data.framePositions || [],
      })
    } catch (error) {
      console.error("Error fetching gallery data:", error)
      // Set default empty data if fetch fails
      setGalleryData({
        images: [],
        framePositions: [],
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch gallery data on component mount
  useEffect(() => {
    fetchGalleryData()
  }, [])

  // Refresh gallery data when user uploads an image
  const handleUploadSuccess = () => {
    fetchGalleryData()
    setActiveTab("gallery") // Switch to gallery view after upload
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Virtual Gallery</h1>
          {userId ? (
            <div className="flex items-center gap-2">
              <div className="text-sm">
                Your ID: <span className="font-mono">{userId}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab("upload")}
              >
                Upload Image
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setActiveTab("join")}>
              Join Gallery
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="container mx-auto py-4">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="join">Join</TabsTrigger>
              <TabsTrigger value="upload" disabled={!userId}>
                Upload
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="gallery" className="mt-0">
            {loading ? (
              <div className="h-[75vh] flex items-center justify-center">
                <div className="text-xl">Loading gallery data...</div>
              </div>
            ) : (
              <div className="h-[75vh]">
                <ArtGallery
                  images={galleryData.images}
                  framePositions={galleryData.framePositions}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="join" className="mt-4">
            <div className="container mx-auto max-w-md py-8">
              <JoinGallery onJoinSuccess={handleJoinSuccess} />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div className="container mx-auto max-w-md py-8">
              <ImageUpload onSuccess={handleUploadSuccess} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-gray-100 dark:bg-gray-900 border-t p-4">
        <div className="container mx-auto text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Virtual Gallery - Upload and showcase your
          artwork in 3D
        </div>
      </footer>
    </div>
  )
} 