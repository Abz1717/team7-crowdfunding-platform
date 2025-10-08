
"use client"
import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Target,
  DollarSign,
  TrendingUp,
  Calendar,
  Megaphone,
  Users,
  Eye,
  MousePointerClick,
  ImageIcon,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useMyPitches } from "@/hooks/useBusinessData"

interface Pitch {
  id: string
  title: string
  elevator_pitch: string
  status: "active" | "draft"
  target_amount: number
  current_amount: number
  end_date: Date
  supporting_media?: string[]
  profit_share: number
  created_at: Date
}

interface AdFormData {
  selectedPitchId: string | null
  adTitle: string
  adDescription: string
  targetAudience: string
  budget: string
  dailyBudget: string
  platform: string
  adImage?: File
  adImageUrl?: string
}

export function AdvertisePitchDialog({ trigger, onAdCreated, pitches }: { trigger: React.ReactNode, onAdCreated?: (ad: any) => void, pitches?: Pitch[] }) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  const [pitchCategory, setPitchCategory] = useState<"active" | "draft">("active")

  // Use pitches from props, or fallback to useMyPitches
  let allPitches: Pitch[] = pitches || []
  if (!pitches) {
    // @ts-ignore
    const { data } = useMyPitches() as any
    allPitches = data?.pitches || []
  }
  const activePitches = allPitches.filter((p) => p.status === "active")
  const draftPitches = allPitches.filter((p) => p.status === "draft")
  const displayedPitches = pitchCategory === "active" ? activePitches : draftPitches

  const [formData, setFormData] = useState<AdFormData>({
    selectedPitchId: null,
    adTitle: "",
    adDescription: "",
    targetAudience: "",
    budget: "",
    dailyBudget: "",
    platform: "social-media",
  adImage: undefined,
  adImageUrl: undefined,
  })

  const selectedPitch = allPitches.find((p) => p.id === formData.selectedPitchId)

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.selectedPitchId !== null
      case 2:
        return (
          formData.adTitle.trim() !== "" &&
          formData.adDescription.trim() !== "" &&
          formData.targetAudience.trim() !== ""
        )
      case 3:
        return formData.budget !== "" && formData.dailyBudget !== ""
      default:
        return false
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1)

    const handleCreate = () => {
      toast.success("Advertisement campaign created successfully!")
      setOpen(false)
      setFormData({
        selectedPitchId: null,
        adTitle: "",
        adDescription: "",
        targetAudience: "",
        budget: "",
         dailyBudget: "",
        platform: "social-media",
      })
      setCurrentStep(1)
    }

  const stepTitles = ["Select Pitch", "Ad Details", "Budget"]

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return "Invalid date"
    let d: Date
    if (date instanceof Date) {
      d = date
    } else {
      d = new Date(date)
    }
    if (isNaN(d.getTime()) || !isFinite(d.getTime())) return "Invalid date"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d)
  }

  const calculateDaysLeft = (endDate: Date | string) => {
    let end: Date
    if (endDate instanceof Date) {

      end = endDate
    } else {
      end = new Date(endDate)
    }

    if (isNaN(end.getTime())) return 0
    return Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setCurrentStep(1)
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
        
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900">Create Advertisement Campaign</DialogTitle>
          <DialogDescription className="text-gray-600">
            Promote your pitch to reach more potential investors.
          </DialogDescription>

        </DialogHeader>

        <div className="space-y-8">
          <div className="flex items-center justify-between px-4">
            {[1, 2, 3].map((s, idx, arr) => (
              <>
                <div key={s} className="flex flex-col items-center relative z-10">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                      s === currentStep
                        ? "border-green-600 bg-green-600 text-white shadow-lg"
                        : s < currentStep
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-gray-300 bg-white text-gray-400",

                    )}
                  >
                    {s < currentStep ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-sm font-medium">{s}</span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-center max-w-20 h-8 flex items-center justify-center text-black">
                    {stepTitles[s - 1]}
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div
                    key={`line-${s}`}
                    className={cn(
                      "h-0.5 w-16 transition-colors duration-300 z-0",
                      s < currentStep ? "bg-green-600" : "bg-gray-300",
                    )}
                    style={{ marginTop: 20 }}
                  />
                )}
              </>
            )).map((element, idx) => (
              <React.Fragment key={idx}>{element}</React.Fragment>
            ))}
          </div>

          <div className="border border-gray-200 rounded-xl p-8 min-h-[500px] bg-white">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Pitch to Advertise</h3>
                      <p className="text-gray-600">Choose from your active or draft pitches</p>
                </div>

                <div className="flex justify-center gap-4 mb-6">
                  <Button
                    variant={pitchCategory === "active" ? "default" : "outline"}
                    onClick={() => setPitchCategory("active")}
                    className={cn(
                      pitchCategory === "active"
                        ? "bg-green-600 text-white hover:bg-green-700 border-green-600"
                        : "border-green-600 text-green-700 hover:bg-green-50",
                    )}
                    style={{ borderWidth: 2 }}
                  >
                    Active Pitches ({activePitches.length})
                  </Button>
                  <Button
                    variant={pitchCategory === "draft" ? "default" : "outline"}
                    onClick={() => setPitchCategory("draft")}
                    className={cn(
                      pitchCategory === "draft"
                        ? "bg-green-600 text-white hover:bg-green-700 border-green-600"
                        : "border-green-600 text-green-700 hover:bg-green-50",
                    )}
                    style={{ borderWidth: 2 }}
                  >
                    Draft Pitches ({draftPitches.length})
                  </Button>
                </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {displayedPitches.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg border-gray-300">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">No {pitchCategory} pitches found</h4>
                      <p className="text-gray-600">Create a pitch first to start advertising</p>
                    </div>
                  ) : (
                    displayedPitches.map((pitch) => {
                      const fundingProgress = (pitch.current_amount / pitch.target_amount) * 100
                      const daysLeft = calculateDaysLeft(pitch.end_date)
                      const isSelected = formData.selectedPitchId === pitch.id

                      return (
                        <Card
                          key={pitch.id}
                          className={cn(
                            "cursor-pointer transition-all duration-200 hover:shadow-lg",
                            isSelected ? "border-2 border-black shadow-md" : "border border-gray-200",
                          )}
                          onClick={() => setFormData({ ...formData, selectedPitchId: pitch.id })}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-xl mb-2 flex items-center gap-2">
                                  {pitch.title}
                                  {isSelected && <CheckCircle className="h-5 w-5 text-black" />}
                                </CardTitle>
                                <CardDescription className="text-base">{pitch.elevator_pitch}</CardDescription>
                              </div>
                              <Badge
                                variant="default"
                                className={cn(
                                  "text-sm px-3 py-1",
                                  pitch.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800",
                                )}
                              >
                                {pitch.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid lg:grid-cols-3 gap-6">
                              {pitch.supporting_media && pitch.supporting_media.length > 0 && (
                                <div className="lg:col-span-2">
                                  <div className="relative aspect-video rounded-lg overflow-hidden">
                                    <Image
                                      src={pitch.supporting_media[0] || "/placeholder.svg"}
                                      alt={pitch.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Target className="h-4 w-4" />
                                    <span>Funding Progress</span>
                                  </div>
                                  <Progress value={fundingProgress} className="h-2" />
                                  <div className="flex justify-between text-xs">
                                    <span>£{pitch.current_amount.toLocaleString()}</span>
                                    <span className="font-semibold">{fundingProgress.toFixed(1)}%</span>
                                    <span>£{pitch.target_amount.toLocaleString()}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Ends {formatDate(pitch.end_date)}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                  <div className="text-sm">
                                    <div className="font-medium">{pitch.profit_share}% profit share</div>
                                    <div className="text-xs text-muted-foreground">To investors</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Advertisement Details</h3>
                  <p className="text-gray-600">Configure your advertising campaign</p>
                </div>

                {selectedPitch && (
                  <Card className="border-2 border-blue-100 bg-blue-50/50">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Advertising: {selectedPitch.title}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                )}

                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <ImageIcon className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                    <h4 className="text-base font-semibold text-gray-800 mb-1">Upload Advertisement Image</h4>
                    <p className="text-gray-600 mb-4">Add an image to make your ad more compelling (JPG, PNG, GIF)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setFormData({ ...formData, adImage: file, adImageUrl: URL.createObjectURL(file) })
                        }
                      }}
                      className="hidden"
                      id="ad-image-upload"
                    />
                    <label htmlFor="ad-image-upload">
                      <Button
                        type="button"
                        className="cursor-pointer bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md"
                        asChild
                      >
                        <span>
                          <Plus className="h-4 w-4 mr-2" />
                          Choose Image
                        </span>
                      </Button>


                    </label>
                    {formData.adImage && (
                      <div className="mt-4 flex flex-col items-center">
                        <div className="relative group w-40 h-40">
                          <img
                            src={formData.adImageUrl || URL.createObjectURL(formData.adImage)}
                            alt="Ad Preview"
                            className="w-full h-full object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full"
                            onClick={() => setFormData({ ...formData, adImage: undefined, adImageUrl: undefined })}
                          >
                            ×
                          </Button>
                        </div>
                        <div className="mt-2 text-xs text-center text-gray-500 truncate">
                          {formData.adImage.name}
                        </div>
                      </div>
                    )}
                  </div>
                    <div className="space-y-2">
                      <Label htmlFor="adTitle" className="text-sm font-medium text-gray-700">
                        Advertisement Title *
                      </Label>
                      <Input
                        id="adTitle"
                        value={formData.adTitle}
                        onChange={(e) => setFormData({ ...formData, adTitle: e.target.value })}
                        placeholder="e.g., Invest in the Future of Smart Homes"
                        className="border-gray-300 focus:border-black focus:ring-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adDescription" className="text-sm font-medium text-gray-700">
                        Advertisement Description *
                      </Label>
                      <Textarea
                        id="adDescription"
                        value={formData.adDescription}
                        onChange={(e) => setFormData({ ...formData, adDescription: e.target.value })}
                        rows={6}
                        className="resize-none border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Describe what makes this investment opportunity compelling..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetAudience" className="text-sm font-medium text-gray-700">
                        Target Audience *
                      </Label>
                      <Input
                        id="targetAudience"
                        value={formData.targetAudience}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                        placeholder="e.g., Tech investors, Angel investors, Venture capitalists"
                        className="border-gray-300 focus:border-black focus:ring-black"
                      />
                    </div>

                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="platform" className="text-sm font-medium text-gray-700">
                      Advertising Platform *
                    </Label>
                    <Select
                      value={formData.platform}
                      onValueChange={(value) => setFormData({ ...formData, platform: value })}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landing-page">Landing Page</SelectItem>
                        <SelectItem value="investor-home">Investor Home Page</SelectItem>
                        <SelectItem value="search-engine">Search Engine</SelectItem>
                        <SelectItem value="search-engine-investor-home">Search Engine + Investor Home Page</SelectItem>
                        <SelectItem value="all">All Platforms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Campaign Budget</h3>
                  <p className="text-gray-600">Set your advertising budget and spending limits</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-800 font-semibold">
                        <DollarSign className="h-5 w-5 text-blue-500" />
                        Total Budget
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="budget" className="text-sm font-medium text-gray-700">
                          Total Campaign Budget (£) *
                        </Label>
                        <Input
                          id="budget"
                          type="number"
                          min="100"
                          value={formData.budget}
                          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                          placeholder="5000"
                          className="border-gray-300 focus:border-black focus:ring-black"
                        />
                        <p className="text-xs text-gray-500">
                          This is the <span className="font-semibold">maximum</span> you want to spend on this advert. <br />
                          <span className="font-semibold">Pay-per-click:</span> Each click from an investor costs <span className="font-semibold">£0.01</span>.<br />
                          Your ad will stop running when the budget is reached or the pitch ends.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dailyBudget" className="text-sm font-medium text-gray-700">
                          Daily Budget Limit (£) *
                        </Label>
                        <Input
                          id="dailyBudget"
                          type="number"
                          min="10"
                          value={formData.dailyBudget}
                          onChange={(e) => setFormData({ ...formData, dailyBudget: e.target.value })}
                          placeholder="200"
                          className="border-gray-300 focus:border-black focus:ring-black"
                        />
                        <p className="text-xs text-gray-500">Maximum to spend per day</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-800 font-semibold">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        Estimated Reach
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <Eye className="h-5 w-5 text-black" />
                            <div>
                              <div className="text-sm text-black">Estimated Impressions</div>
                              <div className="text-2xl font-bold text-black">
                                {formData.budget ? (Number(formData.budget) * 50).toLocaleString() : "0"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <MousePointerClick className="h-5 w-5 text-black" />
                            <div>
                              <div className="text-sm text-black">Estimated Clicks</div>
                              <div className="text-2xl font-bold text-black">
                                {formData.budget ? Math.floor(Number(formData.budget) / 0.01).toLocaleString() : "0"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-black" />
                            <div>
                              <div className="text-sm text-black">Potential Investors</div>
                              <div className="text-2xl font-bold text-black">
                                {formData.budget ? Math.floor(Number(formData.budget) * 0.1).toLocaleString() : "0"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                          Estimates based on platform averages and your budget
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="max-w-4xl mx-auto border-2 border-gray-200 bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Campaign Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Pitch</div>
                        <div className="font-semibold text-sm">{selectedPitch?.title}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Platform</div>
                        <div className="font-semibold text-sm capitalize">{formData.platform.replace("-", " ")}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Total Budget</div>
                        <div className="font-semibold text-sm">
                          £{formData.budget ? Number(formData.budget).toLocaleString() : "0"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="border-green-600 text-green-700 hover:bg-green-50 bg-transparent"
              style={{ borderWidth: 2 }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={!isStepValid(currentStep)}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
              >
                Launch Campaign
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
