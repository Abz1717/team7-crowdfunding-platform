"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  Save,
  X,
  Loader2,
  Trash2,
  Plus,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePitchActions } from "@/hooks/usePitchActions";
import type { Pitch, UpdatePitchData, InvestmentTier } from "@/lib/types/pitch";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIAnalysisDisplay } from "@/components/business/ai-analysis-display";
import { Brain } from "lucide-react";

interface EditPitchDialogProps {
  pitch: Pitch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (pitchId: string) => void;
}

export function EditPitchDialog({
  pitch,
  open,
  onOpenChange,
  onDelete,
}: EditPitchDialogProps) {
  const { updateExistingPitch } = usePitchActions();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [supportingMedia, setSupportingMedia] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    elevator_pitch: "",
    detailed_pitch: "",
    target_amount: "",
    profit_share: "",
    end_date: undefined as Date | undefined,
    status: "draft" as "draft" | "active" | "funded" | "closed",
    investment_tiers: [
      { name: "Bronze", minAmount: "", maxAmount: "", multiplier: "1.0" },
      { name: "Silver", minAmount: "", maxAmount: "", multiplier: "1.2" },
      { name: "Gold", minAmount: "", maxAmount: "", multiplier: "1.5" },
    ] as InvestmentTier[],
  });

  const isFunded = formData.status === "funded";
  const isActive = formData.status === "active";
  const isEditable = !isFunded && !isActive;

  // Populate form when pitch changes
  useEffect(() => {
    if (pitch && open) {
      setFormData({
        title: pitch.title,
        elevator_pitch: pitch.elevator_pitch,
        detailed_pitch: pitch.detailed_pitch,
        target_amount: pitch.target_amount.toString(),
        profit_share: pitch.profit_share.toString(),
        end_date: new Date(pitch.end_date),
        status: pitch.status,
        investment_tiers:
          pitch.investment_tiers?.length > 0
            ? pitch.investment_tiers
            : [
                {
                  name: "Bronze",
                  minAmount: "",
                  maxAmount: "",
                  multiplier: "1.0",
                },
                {
                  name: "Silver",
                  minAmount: "",
                  maxAmount: "",
                  multiplier: "1.2",
                },
                {
                  name: "Gold",
                  minAmount: "",
                  maxAmount: "",
                  multiplier: "1.5",
                },
              ],
      });

      // Set supporting media
      setSupportingMedia(pitch.supporting_media || []);
    }
  }, [pitch, open]);

  const handleSave = async () => {
    if (!pitch) return;

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.elevator_pitch.trim()) {
      toast.error("Elevator pitch is required");
      return;
    }

    if (!formData.end_date) {
      toast.error("End date is required");
      return;
    }

    // make sure to normalize tiers to make sure fields are there and correct type
    const normalizedTiers = (formData.investment_tiers || []).map((tier) => ({
      name: tier.name || "",
      minAmount: tier.minAmount ?? "",
      maxAmount: tier.maxAmount ?? "",
      multiplier: tier.multiplier ?? "1.0",
    }));

    setIsUpdating(true);

    try {
      const updateData: UpdatePitchData = {
        title: formData.title.trim(),
        elevator_pitch: formData.elevator_pitch.trim(),
        detailed_pitch: formData.detailed_pitch.trim(),
        target_amount:
          Number.parseInt(formData.target_amount) || pitch.target_amount,
        profit_share:
          Number.parseInt(formData.profit_share) || pitch.profit_share,
        end_date: formData.end_date.toISOString(),
        status: formData.status,
        investment_tiers: normalizedTiers.filter(
          (tier) => tier.minAmount && tier.maxAmount && tier.multiplier
        ),
        supporting_media: supportingMedia,
      };

      const result = await updateExistingPitch(pitch.id, updateData);

      if (result.success && formData.status === "closed") {
        const { refundInvestorsIfPitchClosed } = await import("@/lib/data");
        await refundInvestorsIfPitchClosed(pitch.id);
      }

      if (result.success) {
        onOpenChange(false);
        toast.success("Pitch updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to update pitch");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTierChange = (
    index: number,
    field: keyof InvestmentTier,
    value: string
  ) => {
    const newTiers = [...formData.investment_tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, investment_tiers: newTiers });
  };

  const uploadFileToSupabase = async (file: File): Promise<string | null> => {
    try {
      const supabase = createClient();

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
        return null;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("Pitch_image").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Unexpected error uploading file:", error);
      toast.error(`Failed to upload ${file.name}`);
      return null;
    }
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

    setIsUploadingMedia(true);

    try {
      const uploadPromises = validFiles.map((file) =>
        uploadFileToSupabase(file)
      );
      const results = await Promise.all(uploadPromises);

      const successfulUploads = results.filter(
        (url): url is string => url !== null
      );

      if (successfulUploads.length > 0) {
        setSupportingMedia((prev) => [...prev, ...successfulUploads]);
        toast.success(
          `${successfulUploads.length} files uploaded successfully`
        );
      }

      if (successfulUploads.length < validFiles.length) {
        toast.error(
          `${
            validFiles.length - successfulUploads.length
          } files failed to upload`
        );
      }
    } finally {
      setIsUploadingMedia(false);
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

  const handleRemoveMedia = async (index: number) => {
    const fileUrl = supportingMedia[index];

    // Remove from Supabase storage
    if (fileUrl) {
      await deleteFileFromSupabase(fileUrl);
    }

    // Remove from local state
    setSupportingMedia((prev) => prev.filter((_, i) => i !== index));
    toast.success("File removed successfully");
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!pitch || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(pitch.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!pitch) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Edit Pitch
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Update your investment pitch details
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Edit Pitch</TabsTrigger>
              <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-8 py-2">
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Update the core details of your pitch
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-title"
                      className="text-sm font-medium text-gray-700"
                    >
                      Title *
                    </Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Enter pitch title"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isFunded || isActive}
                      readOnly={isFunded || isActive}
                    />
                  </div>

                  {isActive ? (
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-status"
                        className="text-sm font-medium text-gray-700"
                      >
                        Status
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            status: value as "active" | "closed",
                          })
                        }
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                      <Input
                        value={formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                        disabled
                        readOnly
                        className="border-gray-300 bg-gray-100 text-gray-500"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit-elevator"
                    className="text-sm font-medium text-gray-700"
                  >
                    Elevator Pitch *
                  </Label>
                  <Textarea
                    id="edit-elevator"
                    value={formData.elevator_pitch}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        elevator_pitch: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Brief description of your pitch"
                    className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isFunded || isActive}
                    readOnly={isFunded || isActive}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit-detailed"
                    className="text-sm font-medium text-gray-700"
                  >
                    Detailed Description
                  </Label>
                  <Textarea
                    id="edit-detailed"
                    value={formData.detailed_pitch}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        detailed_pitch: e.target.value,
                      })
                    }
                    rows={6}
                    placeholder="Detailed description of your business opportunity"
                    className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isFunded || isActive}
                    readOnly={isFunded || isActive}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Financial Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Set your funding goals and investor returns
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-target"
                      className="text-sm font-medium text-gray-700"
                    >
                      Target Amount (£)
                    </Label>
                    <Input
                      id="edit-target"
                      type="number"
                      value={formData.target_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_amount: e.target.value,
                        })
                      }
                      placeholder="250000"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isFunded || isActive}
                      readOnly={isFunded || isActive}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-profit"
                      className="text-sm font-medium text-gray-700"
                    >
                      Profit Share (%)
                    </Label>
                    <Input
                      id="edit-profit"
                      type="number"
                      value={formData.profit_share}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profit_share: e.target.value,
                        })
                      }
                      placeholder="25"
                      max="100"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isFunded || isActive}
                      readOnly={isFunded || isActive}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      End Date *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-gray-300 hover:bg-gray-50",
                            !formData.end_date && "text-gray-500"
                          )}
                          disabled={isFunded || isActive}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date
                            ? format(formData.end_date, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.end_date}
                          onSelect={(date) =>
                            setFormData({ ...formData, end_date: date })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Investment Tiers */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Investment Tiers
                </h3>

                <div className="space-y-4">
                  {formData.investment_tiers.map((tier, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg bg-gray-50 relative"
                    >
                      <div className="flex items-center justify-between mb-3">
                        {(!isFunded && !isActive) ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={tier.name}
                              onChange={e => {
                                const tiers = [...formData.investment_tiers];
                                tiers[index].name = e.target.value;
                                setFormData({ ...formData, investment_tiers: tiers });
                              }}
                              className="w-20 border-gray-300 focus:border-black focus:ring-black text-base font-semibold px-2 py-1"
                            />
                            <span className="font-semibold">Tier</span>
                          </div>
                        ) : (
                          <h4 className="font-semibold">{tier.name} Tier</h4>
                        )}
                        {formData.investment_tiers.length > 1 && !isFunded && !isActive && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="ml-2 h-8 w-8 p-0 rounded-full hover:bg-red-100 hover:text-red-600"
                            onClick={() => {
                              const tiers = formData.investment_tiers.filter((_, i) => i !== index);
                              setFormData({ ...formData, investment_tiers: tiers });
                            }}
                            title="Remove tier"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Min Amount (£)</Label>
                          <Input
                            type="number"
                            value={tier.minAmount}
                            onChange={(e) =>
                              handleTierChange(
                                index,
                                "minAmount",
                                e.target.value
                              )
                            }
                            placeholder="1000"
                            disabled={isFunded || isActive}
                            readOnly={isFunded || isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Amount (£)</Label>
                          <Input
                            type="number"
                            value={tier.maxAmount}
                            onChange={(e) =>
                              handleTierChange(
                                index,
                                "maxAmount",
                                e.target.value
                              )
                            }
                            placeholder="5000"
                            disabled={isFunded || isActive}
                            readOnly={isFunded || isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Multiplier</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={tier.multiplier}
                            onChange={(e) =>
                              handleTierChange(
                                index,
                                "multiplier",
                                e.target.value
                              )
                            }
                            placeholder="1.0"
                            disabled={isFunded || isActive}
                            readOnly={isFunded || isActive}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supporting Media */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Supporting Media
                </h3>

                <div className="space-y-4">
                  {/* Upload Section */}
                  <div className={
                    `border-2 border-dashed border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors relative` +
                    ((isFunded || isActive) ? ' bg-gray-100 opacity-70 pointer-events-none' : '')
                  }>
                    {(isFunded || isActive) && (
                      <div className="absolute inset-0 bg-gray-100 opacity-60 z-10 rounded-lg" />
                    )}
                    <div className="text-center relative z-20">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          Upload images to showcase your pitch
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="media-upload"
                            disabled={isUploadingMedia || isFunded || isActive}
                          />
                          <label htmlFor="media-upload">
                            <Button
                              type="button"
                              disabled={isUploadingMedia || isFunded || isActive}
                              className="cursor-pointer"
                              asChild
                            >
                              <span>
                                {isUploadingMedia ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Images
                                  </>
                                )}
                              </span>
                            </Button>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Media Grid */}
                  {supportingMedia.length > 0 && (
                    <div className={
                      `space-y-4 relative` + ((isFunded || isActive) ? ' bg-gray-100 opacity-70 pointer-events-none rounded-lg' : '')
                    }>
                      {(isFunded || isActive) && (
                        <div className="absolute inset-0 bg-gray-100 opacity-60 z-10 rounded-lg" />
                      )}
                      <div className="flex items-center justify-between relative z-20">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Current Media ({supportingMedia.length})
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 relative z-20">
                        {supportingMedia.map((url, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                              <img
                                src={url || "/placeholder.svg"}
                                alt={`Media ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                            <div className="absolute top-2 right-2">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                onClick={() => handleRemoveMedia(index)}
                                title="Remove image"
                                disabled={isFunded || isActive}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai-analysis" className="space-y-6 py-4">
              {pitch.ai_analysis ? (
                <AIAnalysisDisplay
                  analysis={pitch.ai_analysis}
                  showRegenerateButton={false}
                />
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    No AI Analysis Available
                  </h4>
                  <p className="text-gray-600">
                    This pitch was created before AI analysis was available.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-200">
            {onDelete && (formData.status === "draft" || formData.status === "closed") && (
              <Button
                variant="outline"
                onClick={handleDeleteClick}
                disabled={isUpdating || isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Pitch
                  </>
                )}
              </Button>
            )}

            {/* Right Side Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUpdating || isDeleting}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUpdating || isDeleting}
                className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Pitch"
        description={`Are you sure you want to delete "${pitch.title}"? This action cannot be undone and will permanently remove the pitch and all its data.`}
        confirmText="Delete Pitch"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
