"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  Plus,
  DollarSign,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Target,
  ImageIcon,
  Brain,
  TrendingUp,
  AlertTriangle,
  ThumbsUp,
  Lightbulb,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBusinessPitchActions } from "@/hooks/useBusinessPitchActions";
import type { PitchFormData, AIAnalysis } from "@/lib/types/pitch";
import { createClient } from "@/utils/supabase/client";
import { generatePitchAnalysisDirect } from "@/lib/ai/gemini-direct";
import { AIAnalysisDisplay } from "@/components/business/ai-analysis-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CreatePitchDialogProps {
  onCreated?: (pitch: unknown) => void;
}

export function CreatePitchDialog({ onCreated }: CreatePitchDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { createNewPitch } = useBusinessPitchActions();

  const [formData, setFormData] = useState<PitchFormData>({
    title: "",
    elevatorPitch: "",
    detailedPitch: "",
    targetAmount: "",
    profitShare: "",
    profitDistributionFrequency: "monthly",
    tags: [],
    endDate: undefined as Date | undefined,
    tiers: [],
  });

  // Field-level validation helpers
  const getTitleError = () => {
    if (formData.title.trim() === "") return "Product title is required.";
    return null;
  };
  const getElevatorPitchError = () => {
    if (formData.elevatorPitch.trim() === "")
      return "Elevator pitch is required.";
    return null;
  };
  const getDetailedPitchError = () => {
    if (formData.detailedPitch.trim() === "")
      return "Detailed business case is required.";
    return null;
  };
  const getTargetAmountError = () => {
    if (formData.targetAmount === "") return null;
    const val = Number(formData.targetAmount);
    if (isNaN(val) || val < 1000 || val > 1000000000)
      return "Target amount must be between £1,000 and £1,000,000,000.";
    return null;
  };

  const [tagInput, setTagInput] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const suggestedTags = [
    "Technology",
    "Healthcare",
    "Fintech",
    "AI",
    "SaaS",
    "Consumer",
    "B2B",
    "Marketplace",
    "Climate",
    "Education",
    "Gaming",
    "Web3",
    "Other",
  ];

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const getTierValidationError = (index: number) => {
    const t = formData.tiers[index];
    if (t.minAmount === "" || t.maxAmount === "" || t.multiplier === "")
      return "All fields are required.";
    const min = Number(t.minAmount);
    const max = Number(t.maxAmount);
    const mult = Number(t.multiplier);
    if (isNaN(min) || isNaN(max)) return "Min and Max must be numbers.";
    if (min <= 0 || max <= 0) return "Min and Max must be greater than 0.";
    if (min > max) return "Min must be less than or equal to Max.";
    if (index > 0) {
      const prevMax = Number(formData.tiers[index - 1].maxAmount);
      if (isNaN(prevMax) || min <= prevMax)
        return "Min must be greater than previous tier's Max (no overlap).";
      const prevMult = Number(formData.tiers[index - 1].multiplier);
      if (!isNaN(prevMult) && mult < prevMult)
        return "Multiplier must be greater than or equal to previous tier's multiplier.";
    }
    if (index === formData.tiers.length - 1 && formData.targetAmount !== "") {
      const target = Number(formData.targetAmount);
      if (!isNaN(target) && max > target)
        return "Max for last tier cannot exceed target investment amount.";
    }
    return null;
  };

  const getProfitShareError = () => {
    if (formData.profitShare === "") return null;
    const val = Number(formData.profitShare);
    if (isNaN(val) || val < 1 || val > 100)
      return "Profit share must be between 1 and 100.";
    return null;
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.title.trim() !== "" && formData.elevatorPitch.trim() !== ""
        );
      case 2:
        return formData.detailedPitch.trim() !== "";
      case 3: {
        const profitShareNum = Number(formData.profitShare);
        const targetAmountNum = Number(formData.targetAmount);
        return (
          formData.targetAmount !== "" &&
          !isNaN(targetAmountNum) &&
          targetAmountNum >= 1000 &&
          targetAmountNum <= 1000000000 &&
          formData.profitShare !== "" &&
          formData.endDate
        );
      }
      case 4: {
        const tiers = formData.tiers;
        for (let i = 0; i < tiers.length; i++) {
          const t = tiers[i];
          if (t.minAmount === "" || t.maxAmount === "" || t.multiplier === "")
            return false;
          const min = Number(t.minAmount);
          const max = Number(t.maxAmount);
          if (isNaN(min) || isNaN(max)) return false;
          if (min <= 0 || max <= 0) return false;
          if (min > max) return false;
          if (i > 0) {
            const prevMax = Number(tiers[i - 1].maxAmount);
            if (isNaN(prevMax) || min <= prevMax) return false;
          }
        }
        return true;
      }
      case 5:
        return true; // Supporting media is optional
      case 6:
        return aiAnalysis !== null;
      default:
        return false;
    }
  };

  const nextStep = async () => {
    if (currentStep < totalSteps && isStepValid(currentStep)) {
      if (currentStep === 5) {
        setCurrentStep(currentStep + 1);
        await generateAiAnalysis();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const addTier = () => {
    setFormData({
      ...formData,
      tiers: [
        ...formData.tiers,
        { name: "", minAmount: "", maxAmount: "", multiplier: "1.0" },
      ],
    });
  };

  const removeTier = (index: number) => {
    setFormData({
      ...formData,
      tiers: formData.tiers.filter((_, i) => i !== index),
    });
  };

  const updateTier = (
    index: number,
    field: keyof (typeof formData.tiers)[0],
    value: string
  ) => {
    const newTiers = [...formData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, tiers: newTiers });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    // Validate file types (images only)
    const validFiles = fileArray.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      if (!isValidType) {
        toast.error(`${file.name} is not a valid image file`);
      }
      return isValidType;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadedFiles(validFiles);

    try {
      const urls = await uploadFilesToSupabase(validFiles);
      setUploadedFileUrls((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} files uploaded successfully`);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload files.");
    } finally {
      setIsUploading(false);
      // Clear the input
      event.target.value = "";
    }
  };

  const deleteFileFromSupabase = async (fileUrl: string) => {
    try {
      const supabase = createClient();
      const urlParts = fileUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `pitch-media/${fileName}`;

      await supabase.storage.from("Pitch_image").remove([filePath]);
    } catch (error) {
      console.error("Error removing file from storage:", error);
    }
  };

  const removeFile = async (indexToRemove: number) => {
    const fileUrl = uploadedFileUrls[indexToRemove];

    // Remove from Supabase storage
    if (fileUrl) {
      await deleteFileFromSupabase(fileUrl);
    }

    // Remove from local state
    setUploadedFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
    setUploadedFileUrls((prevUrls) =>
      prevUrls.filter((_, index) => index !== indexToRemove)
    );

    toast.success("File removed successfully");
  };

  const handleCreate = async () => {
    if (!formData.endDate) {
      toast.error("Please select an end date");
      return;
    }

    // make sure to normalize tiers to make sure fields are there and correct type
    const normalizedTiers = (formData.tiers || []).map((tier) => ({
      name: tier.name || "",
      minAmount: tier.minAmount ?? "",
      maxAmount: tier.maxAmount ?? "",
      multiplier: tier.multiplier ?? "1.0",
    }));

    setIsCreating(true);
    try {
      const result = await createNewPitch(
        { ...formData, tiers: normalizedTiers },
        aiAnalysis || undefined,
        uploadedFileUrls
      );

      if (result.success) {
        // Reset form and close dialog
        setFormData({
          title: "",
          elevatorPitch: "",
          detailedPitch: "",
          targetAmount: "",
          profitShare: "",
          profitDistributionFrequency: "monthly",
          tags: [],
          endDate: undefined,
          tiers: [],
        });
        setTagInput("");
        setCurrentStep(1);
        setAiAnalysis(null);
        setUploadedFiles([]);
        setUploadedFileUrls([]);
        setOpen(false);

        if (onCreated && result.data) {
          onCreated(result.data);
        }
      }
    } finally {
      setIsCreating(false);
    }
  };

  const uploadFilesToSupabase = async (files: File[]): Promise<string[]> => {
    const supabase = createClient();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}.${fileExt}`;
        const filePath = `pitch-media/${fileName}`;

        // Upload file to Supabase storage
        const { data, error } = await supabase.storage
          .from("Pitch_image")
          .upload(filePath, file);

        if (error) {
          console.error("Error uploading file:", error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("Pitch_image").getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error("Unexpected error uploading file:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    return uploadedUrls;
  };

  const generateAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await generatePitchAnalysisDirect(formData);
      setAiAnalysis(analysis);
      toast.success("AI analysis completed successfully!");
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      toast.error("Failed to generate AI analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stepTitles = [
    "Basic Info",
    "Business Case",
    "Investment Terms",
    "Investment Tiers",
    "Supporting Media",
    "AI Analysis",
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setCurrentStep(1);
          setAiAnalysis(null);
          setUploadedFiles([]);
          setUploadedFileUrls([]);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 bg-black hover:bg-gray-900 text-white font-medium px-4 py-2">
          <Plus className="h-4 w-4" />
          Create New Pitch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Create Investment Pitch
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Follow our guided process to create a compelling investment pitch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          <div className="flex items-center justify-between px-4">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className="flex flex-col items-center relative">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                    s === currentStep
                      ? "border-black bg-black text-white shadow-lg"
                      : s < currentStep
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-gray-400"
                  )}
                >
                  {s < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{s}</span>
                  )}
                </div>
                <div className="mt-2 text-xs text-center max-w-16 h-8 flex items-center justify-center text-gray-600">
                  {stepTitles[s - 1]}
                </div>
                {s < 6 && (
                  <div
                    className={cn(
                      "absolute top-5 left-13 w-30 h-0.5 transition-colors duration-300",
                      s < currentStep ? "bg-black" : "bg-gray-300"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="border border-gray-200 rounded-xl p-8 min-h-[400px] bg-white">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Basic Information
                  </h3>
                  <p className="text-gray-600">
                    Start with the fundamentals of your pitch
                  </p>
                </div>
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="space-y-2">
                    <Label
                      htmlFor="title"
                      className="text-sm font-medium text-gray-700"
                    >
                      Product Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g., EcoTech Smart Home Solutions"
                      className="border-gray-300 focus:border-black focus:ring-black"
                    />
                    {getTitleError() && (
                      <p className="text-xs text-red-600 mt-1">
                        {getTitleError()}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="elevatorPitch"
                      className="text-sm font-medium text-gray-700"
                    >
                      Elevator Pitch *
                    </Label>
                    <Textarea
                      id="elevatorPitch"
                      value={formData.elevatorPitch}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          elevatorPitch: e.target.value,
                        })
                      }
                      rows={4}
                      className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Revolutionary IoT devices that reduce energy consumption by 40%..."
                    />
                    {getElevatorPitchError() && (
                      <p className="text-xs text-red-600 mt-1">
                        {getElevatorPitchError()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Business Case
                  </h3>
                  <p className="text-gray-600">
                    Detailed explanation of your business opportunity
                  </p>
                </div>
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="space-y-2">
                    <Label
                      htmlFor="detailedPitch"
                      className="text-sm font-medium text-gray-700"
                    >
                      Detailed Business Case *
                    </Label>
                    <Textarea
                      id="detailedPitch"
                      value={formData.detailedPitch}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          detailedPitch: e.target.value,
                        })
                      }
                      rows={12}
                      className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Describe your product/service, market opportunity, target customers..."
                    />
                    {getDetailedPitchError() && (
                      <p className="text-xs text-red-600 mt-1">
                        {getDetailedPitchError()}
                      </p>
                    )}
                  </div>
                  {/* Pitch Tags moved here */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Pitch Tags
                    </Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedTag}
                        onValueChange={(value) => setSelectedTag(value)}
                      >
                        <SelectTrigger className="w-full border-gray-300 focus:border-black focus:ring-black">
                          <SelectValue placeholder="Choose a common tag" />
                        </SelectTrigger>
                        <SelectContent>
                          {suggestedTags.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedTag === "Other" && (
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Enter custom tag"
                          className="border-gray-300 focus:border-black focus:ring-black"
                        />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (selectedTag === "Other") {
                            const custom = tagInput.trim();
                            if (custom && !formData.tags.includes(custom)) {
                              setFormData({
                                ...formData,
                                tags: [...formData.tags, custom],
                              });
                              setTagInput("");
                              setSelectedTag("");
                            }
                            return;
                          }

                          if (
                            selectedTag &&
                            !formData.tags.includes(selectedTag)
                          ) {
                            setFormData({
                              ...formData,
                              tags: [...formData.tags, selectedTag],
                            });
                            setSelectedTag("");
                          }
                        }}
                        className="border-gray-300"
                      >
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <div
                            key={tag}
                            className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Investment Terms
                  </h3>
                  <p className="text-gray-600">
                    Define your funding requirements and investor returns
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-800 font-semibold">
                        <DollarSign className="h-5 w-5 text-blue-500" />
                        Funding Target
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="targetAmount"
                          className="text-sm font-medium text-gray-700"
                        >
                          Target Investment Amount (£) *
                        </Label>
                        <Input
                          id="targetAmount"
                          type="number"
                          min="1000"
                          max="1000000000"
                          value={formData.targetAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              targetAmount: e.target.value,
                            })
                          }
                          placeholder="250000"
                          className="border-gray-300 focus:border-black focus:ring-black"
                        />
                        <p className="text-xs text-gray-500">
                          
                          {getTargetAmountError() && (
                            <p className="text-xs text-red-600 font-medium mt-1">
                              {getTargetAmountError()}
                            </p>
                          )}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Investment Window End Date *
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal border-gray-300",
                                !formData.endDate && "text-gray-400"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                              {formData.endDate
                                ? format(formData.endDate, "PPP")
                                : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-none shadow-md">
                            <Calendar
                              mode="single"
                              selected={formData.endDate}
                              onSelect={(date) =>
                                setFormData({ ...formData, endDate: date })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-800 font-semibold">
                        <Target className="h-5 w-5 text-blue-500" />
                        Investor Returns
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="profitShare"
                          className="text-sm font-medium text-gray-700"
                        >
                          Investor Profit Share (%) *
                        </Label>
                        <Input
                          id="profitShare"
                          type="number"
                          min="1"
                          max="100"
                          value={formData.profitShare}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              profitShare: e.target.value,
                            })
                          }
                          placeholder="25"
                          className="border-gray-300 focus:border-black focus:ring-black"
                        />
                        <p className="text-xs text-gray-500">
                          Percentage of profits to share with investors (1-100%)
                        </p>
                        {getProfitShareError() && (
                          <p className="text-xs text-red-600 font-medium mt-1">
                            {getProfitShareError()}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="profitDistribution"
                          className="text-sm font-medium text-gray-700"
                        >
                          Profit Distribution Frequency *
                        </Label>
                        <select
                          id="profitDistribution"
                          value={formData.profitDistributionFrequency}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              profitDistributionFrequency: e.target.value,
                            })
                          }
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="semi-annually">Semi-Annually</option>
                          <option value="annually">Annually</option>
                        </select>
                        <p className="text-xs text-gray-500">
                          How often will profits be distributed to investors?
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Investment Tiers
                  </h3>
                  <p className="text-gray-600">
                    Create custom investment tiers with different benefit levels
                  </p>
                </div>
                <div className="space-y-6 max-w-3xl mx-auto">
                  {formData.tiers.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        No Tiers Yet
                      </h4>
                      <p className="text-gray-600 mb-6">
                        Create investment tiers to offer different benefits to
                        investors
                      </p>
                      <Button
                        type="button"
                        onClick={addTier}
                        className="bg-black hover:bg-gray-900 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Tier
                      </Button>
                    </div>
                  ) : (
                    <>
                      {formData.tiers.map((tier, index) => (
                        <Card
                          key={index}
                          className="border border-gray-200 shadow-sm relative"
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg font-semibold text-gray-800 mb-2">
                                  Tier {index + 1}
                                </CardTitle>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTier(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Tier Name *
                              </Label>
                              <Input
                                type="text"
                                value={tier.name}
                                onChange={(e) =>
                                  updateTier(index, "name", e.target.value)
                                }
                                placeholder="e.g., Starter, Premium, Elite"
                                className="border-gray-300 focus:border-black focus:ring-black"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">
                                  Min Amount (£) *
                                </Label>
                                <Input
                                  type="number"
                                  value={tier.minAmount}
                                  onChange={(e) =>
                                    updateTier(
                                      index,
                                      "minAmount",
                                      e.target.value
                                    )
                                  }
                                  placeholder="1000"
                                  className="border-gray-300 focus:border-black focus:ring-black"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">
                                  Max Amount (£) *
                                </Label>
                                <Input
                                  type="number"
                                  value={tier.maxAmount}
                                  onChange={(e) =>
                                    updateTier(
                                      index,
                                      "maxAmount",
                                      e.target.value
                                    )
                                  }
                                  placeholder="5000"
                                  className="border-gray-300 focus:border-black focus:ring-black"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">
                                  Multiplier *
                                </Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={tier.multiplier}
                                  onChange={(e) =>
                                    updateTier(
                                      index,
                                      "multiplier",
                                      e.target.value
                                    )
                                  }
                                  placeholder="1.0"
                                  className="border-gray-300 focus:border-black focus:ring-black"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          onClick={addTier}
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Another Tier
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Supporting Media
                  </h3>
                  <p className="text-gray-600">
                    Add visual content to strengthen your pitch
                  </p>
                </div>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Upload Images
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Add images that support your pitch (JPG, PNG, GIF)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      type="button"
                      disabled={isUploading}
                      className="cursor-pointer bg-black hover:bg-gray-900 text-white font-medium px-4 py-2 rounded-md"
                      asChild
                    >
                      <span>
                        {isUploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Choose Files
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>

                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Uploaded Images ({uploadedFiles.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                            {uploadedFileUrls[index] ? (
                              <img
                                src={
                                  uploadedFileUrls[index] || "/placeholder.svg"
                                }
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                              </div>
                            )}
                          </div>
                          <div className="absolute top-2 right-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full"
                              onClick={() => removeFile(index)}
                            >
                              ×
                            </Button>
                          </div>
                          <div className="mt-2 text-xs text-center text-gray-500 truncate">
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                    <Brain className="h-5 w-5 text-blue-500" />
                    AI Pitch Analysis
                  </h3>
                  <p className="text-gray-600">
                    Get intelligent feedback and recommendations for your pitch
                  </p>
                </div>

                {isAnalyzing ? (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-pulse" />
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      Analyzing Your Pitch...
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Our AI is evaluating your business case and investment
                      terms
                    </p>
                    <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full animate-pulse"
                        style={{ width: "60%" }}
                      />
                    </div>
                  </div>
                ) : aiAnalysis ? (
                  <AIAnalysisDisplay
                    analysis={aiAnalysis}
                    showRegenerateButton={true}
                    onRegenerate={generateAiAnalysis}
                    isRegenerating={isAnalyzing}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      Ready for AI Analysis
                    </h4>
                    <p className="text-gray-600 mb-6">
                      Get intelligent feedback and recommendations for your
                      pitch
                    </p>
                    <Button
                      onClick={generateAiAnalysis}
                      disabled={isAnalyzing}
                      className="bg-black hover:bg-gray-900 text-white"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Generate AI Analysis
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="bg-black hover:bg-gray-900 text-white"
              >
                {currentStep === 5 ? "Analyze Pitch" : "Next Step"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={isCreating || !aiAnalysis}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
              >
                {isCreating ? "Creating..." : "Create Pitch"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
