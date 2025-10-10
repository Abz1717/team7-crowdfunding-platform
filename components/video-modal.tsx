"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface VideoSection {
  id: number
  title: string
  videoUrl: string
}

const videoSections: VideoSection[] = [
  {
    id: 1,
    title: "Signing Up",
    videoUrl: "https://ybtwbobuezbilcxxftsd.supabase.co/storage/v1/object/public/videos/Sign%20Up-4K60H.MOV",
  },
  {
    id: 2,
    title: "Create a pitch",
    videoUrl: "https://ybtwbobuezbilcxxftsd.supabase.co/storage/v1/object/public/videos/Create%20a%20pitch-4K60H.MOV",
  },
  {
    id: 3,
    title: "Manage Pitches",
    videoUrl: "https://ybtwbobuezbilcxxftsd.supabase.co/storage/v1/object/public/videos/Manage%20pitches-4K60H.MOV",
  },
  {
    id: 4,
    title: "Invest in a Pitch",
    videoUrl: "https://ybtwbobuezbilcxxftsd.supabase.co/storage/v1/object/public/videos/Invest%20in%20a%20pitch-4K60H.MOV",
  },
  {
    id: 5,
    title: "Declare Profits",
    videoUrl: "https://ybtwbobuezbilcxxftsd.supabase.co/storage/v1/object/public/videos/Declare%20Profits-4K60H.MOV",
  },
  {
    id: 6,
    title: "Investor Portfolio",
    videoUrl: "https://ybtwbobuezbilcxxftsd.supabase.co/storage/v1/object/public/videos/Investment%20portfolio-4K60H.MOV",
  },
  {
    id: 7,
    title: "Business Dashboard",
    videoUrl: "https://ybtwbobuezbilcxxftsd.supabase.co/storage/v1/object/public/videos/Business%20Dashboard-4K60H.MOV",
  },
  {
    id: 8,
    title: "Ad Campaign",
    videoUrl: "https://ybtwbobuezbilcxxftsd.supabase.co/storage/v1/object/public/videos/Ad%20Campgain-4K60H.MOV",
  },
]

interface VideoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VideoModal({ open, onOpenChange }: VideoModalProps) {
  const [currentSection, setCurrentSection] = useState(0)

  const handlePrevious = () => {
    setCurrentSection((prev) => (prev > 0 ? prev - 1 : videoSections.length - 1))
  }

const handleNext = () => {
    setCurrentSection((prev) => (prev < videoSections.length - 1 ? prev + 1 : 0))
  }

  const handleClose = () => {
    setCurrentSection(0)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="!max-w-[calc(100vw-2rem)] w-[calc(100vw-2rem)] max-h-[95vh] h-[95vh] p-0 gap-0 bg-black border-0"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">
          {videoSections[currentSection].title} - Video Tutorial ({currentSection + 1} of {videoSections.length})
        </DialogTitle>
        
        <div className="relative h-full w-full">

          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="relative w-full h-[calc(95vh-64px)] bg-black flex items-center justify-center">
            <Button
              onClick={handlePrevious}
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-black/40 hover:bg-black/70 text-white rounded-full p-2"
              aria-label="Previous video"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <video
              key={videoSections[currentSection].id}
              className="w-full h-full object-contain"
              controls
              autoPlay
              src={videoSections[currentSection].videoUrl}
            >
              Your browser does not support the video tag.
            </video>

            <Button
              onClick={handleNext}
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-black/40 hover:bg-black/70 text-white rounded-full p-2"
              aria-label="Next video"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>

            <div className="bg-slate-900 p-2 flex items-center justify-between w-full">
              <Button
                onClick={handlePrevious}
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                <ChevronLeft className="mr-1 h-3 w-3" />
                Previous
              </Button>

              <div className="flex items-center gap-3">
                <div className="text-white text-center">
                  <div className="text-xs font-medium">
                    {currentSection + 1} / {videoSections.length}
                  </div>
                  <div className="text-sm font-bold">
                    {videoSections[currentSection].title}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {videoSections.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSection(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentSection ? "bg-blue-500 w-6" : "bg-slate-600 hover:bg-slate-500"
                      }`}
                      aria-label={`Go to section ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleNext}
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                Next
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
