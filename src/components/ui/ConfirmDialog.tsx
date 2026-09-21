import React from 'react';
import { Modal } from './Modal.tsx';
import { PixelButton } from './PixelButton.tsx';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'berry' | 'moss' | 'oak';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="sm">
      <div className="space-y-4">
        <p className="font-pixel-body text-base text-cocoa leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <PixelButton variant="oak" size="sm" onClick={onCancel}>
            {cancelLabel}
          </PixelButton>
          <PixelButton
            variant={variant === 'danger' || variant === 'berry' ? 'berry' : variant === 'moss' || variant === 'primary' ? 'moss' : 'oak'}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </PixelButton>
        </div>
      </div>
    </Modal>
  );
};
