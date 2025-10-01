import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
}

export function SuccessDialog({
  open,
  onOpenChange,
  title = "Success!",
  description = "Your action was successful.",
  confirmText = "OK",
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-2 border-black bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-black bg-white">
              <CheckCircle2 className="h-5 w-5 text-black" />
            </div>
            <DialogTitle className="text-lg font-semibold text-black">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-700 leading-relaxed">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} autoFocus className="rounded-full border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors">{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
