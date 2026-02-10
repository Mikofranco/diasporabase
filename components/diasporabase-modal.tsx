// components/ui/Modal.tsx
import React from 'react';
import { X } from 'lucide-react'; // or any close icon library

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  maxHeight?: string; // e.g. 'max-h-[85vh]'
  showCloseButton?: boolean;
  preventOutsideClose?: boolean;
  className?: string;
  contentClassName?: string;
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] w-[95vw] h-[95vh]',
};

const DiasporaBaseModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  maxHeight = 'max-h-[90vh]',
  showCloseButton = true,
  preventOutsideClose = false,
  className = '',
  contentClassName = '',
  footer,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !preventOutsideClose) {
      onClose();
    }
  };

  // Close on Escape key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`
          relative w-full ${sizeClasses[size]} mx-4 sm:mx-6
          bg-white dark:bg-gray-900 
          rounded-2xl shadow-2xl overflow-hidden
          transform transition-all duration-300
          ${maxHeight} overflow-y-auto
          ${className}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}

            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            )}
          </div>
        )}

        {/* Main content */}
        <div className={`p-6 ${contentClassName}`}>
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="flex flex-col sm:flex-row justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiasporaBaseModal;