import { Dialog } from "./dialog";
import { Button } from "./button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  onError?: (error: unknown) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "destructive";
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onError,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        console.error("ConfirmDialog confirmation failed", error);
      }
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-5">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3 pt-4 border-border/20 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            size="sm"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={() => {
              void handleConfirm();
            }}
            isLoading={isLoading}
            size="sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
