"use client";
import React, { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { match } from "path-to-regexp";

// Type for route parameters
type RouteParams = Record<string, string | number>;

// Enhanced Modal Props with generic type parameter
type ModalProps<T extends RouteParams> = {
  id?: string;
  layer?: "primary" | "secondary";
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: (params: T) => void;
  children: React.ReactNode;
  className?: string;
};

type ModalHeaderProps = {
  children: React.ReactNode;
  className?: string;
};

type ModalBodyProps = {
  children: React.ReactNode;
  className?: string;
};

type ModalFooterProps = {
  children: React.ReactNode;
  className?: string;
};

type ModalComponent<T extends RouteParams> = React.FC<ModalProps<T>> & {
  Header: React.FC<ModalHeaderProps>;
  Body: React.FC<ModalBodyProps>;
  Footer: React.FC<ModalFooterProps>;
};

type ModalHandlers<T extends RouteParams = RouteParams> = {
  open: (params: T) => void;
  toggle: (params: T) => void;
  close: () => void;
  pattern: string;
};

// Global modal state manager
const modalRegistry = new Map<string, ModalHandlers>();
const registerModal = <T extends RouteParams>(
  pattern: string,
  handlers: ModalHandlers<T>
) => {
  // @ts-expect-error ...
  modalRegistry.set(pattern, handlers);
};

const unregisterModal = (pattern: string) => {
  modalRegistry.delete(pattern);
};

const findMatchingModal = (path: string) => {
  for (const [pattern, handlers] of modalRegistry) {
    console.log(`Checking pattern: ${path} against ${pattern}`);
    const matchFn = match(pattern, { decode: decodeURIComponent });
    const result = matchFn(path);
    if (result) {
      return {
        handlers,
        params: result.params as RouteParams,
      };
    }
  }
  return null;
};

// Global click handler
const documentClickHandler = (e: MouseEvent) => {
  const target = e.target as HTMLElement | null;
  const trigger = target?.closest("[data-modal-trigger]");
  const toggle = target?.closest("[data-modal-toggle]");
  const hide = target?.closest("[data-modal-hide]");

  if (trigger) {
    const modalPath = trigger.getAttribute("data-modal-trigger");
    if (!modalPath) return;

    const match = findMatchingModal(modalPath);
    if (!match) {
      console.error(`No modal found matching path: ${modalPath}`);
      return;
    }

    e.preventDefault();
    match.handlers.open(match.params);
  }

  if (toggle) {
    const modalPath = toggle.getAttribute("data-modal-toggle");
    if (!modalPath) return;

    const match = findMatchingModal(modalPath);
    if (!match) {
      console.error(`No modal found matching path: ${modalPath}`);
      return;
    }

    e.preventDefault();
    match.handlers.toggle(match.params);
  }

  if (hide) {
    let modalPath = hide.getAttribute("data-modal-hide");
    if ([null, undefined, "true"].includes(modalPath)) {
      const modal = hide.closest("[role=dialog]");
      modalPath = modal?.id || null;
    }
    if (!modalPath) return;

    const match = findMatchingModal(modalPath);
    if (!match) {
      console.error(`No modal found matching path: ${modalPath}`);
      return;
    }

    e.preventDefault();
    match.handlers.close();
  }
};

const Modal: ModalComponent<RouteParams> = <T extends RouteParams>({
  id,
  layer = "primary",
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  onOpen: externalOnOpen,
  children,
  className = "",
}: ModalProps<T>) => {
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    externalOnClose?.();
  }, [externalOnClose]);

  const handleOpen = useCallback(
    (param: T) => {
      setIsOpen(true);
      externalOnOpen?.(param);
    },
    [externalOnOpen]
  );

  const handleToggle = useCallback(
    (param: T) => {
      if (isOpen) {
        handleClose();
      }
      handleOpen(param);
    },
    [isOpen, handleClose, handleOpen]
  );

  useEffect(() => {
    if (id) {
      registerModal(id, {
        open: handleOpen,
        close: handleClose,
        toggle: handleToggle,
        pattern: id,
      });

      return () => unregisterModal(id);
    }
  }, [id, handleOpen, handleClose, handleToggle]);

  // Sync with external state if provided
  useEffect(() => {
    if (externalIsOpen === true) {
      handleOpen({} as T);
    } else if (externalIsOpen === false) {
      handleClose();
    }
  }, [externalIsOpen, handleOpen, handleClose]);

  useEffect(() => {
    console.log(`Modal ${id} is ${isOpen ? "open" : "closed"}`);
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      const timeout = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timeout);
    }
  }, [isOpen, id]);

  if (!isOpen && !isAnimating) return null as React.ReactNode;

  return (
    <div
      role="dialog"
      id={id}
      className={`
        fixed inset-0 flex items-center justify-center
        ${isOpen ? "animate-fade-in" : "animate-fade-out"}
        ${layer === "primary" ? "z-50" : "z-[60]"}
        bg-black bg-opacity-50 transition-opacity duration-300
      `}
      onClick={handleClose}
      style={{
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div
        className={`
          relative flex flex-col w-full max-w-2xl max-h-[calc(100vh-2rem)] m-4
          bg-white dark:bg-gray-700 rounded-lg shadow-xl
          ${isOpen ? "animate-slide-up" : "animate-slide-down"}
          transition-transform duration-300
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

Modal.Header = ({ children, className = "" }) => (
  <div
    className={`
    flex items-center justify-between p-4 md:p-5
    border-b dark:border-gray-600 rounded-t
    ${className}
  `}
  >
    <div className="text-xl font-semibold text-gray-900 dark:text-white">
      {children}
    </div>
    <button
      data-modal-hide
      type="button"
      className="text-gray-700 bg-gray-300 hover:bg-gray-200 
        hover:text-gray-900 rounded-full text-sm w-8 h-8 
        inline-flex justify-center items-center
        dark:hover:bg-gray-600 dark:hover:text-white"
    >
      <X className="w-4 h-4" />
      <span className="sr-only">Close modal</span>
    </button>
  </div>
);

Modal.Header.displayName = "Modal.Header";

Modal.Body = ({ children, className = "" }) => (
  <div className={`flex-1 p-4 md:p-5 space-y-4 overflow-y-auto ${className}`}>
    {children}
  </div>
);

Modal.Body.displayName = "Modal.Body";

Modal.Footer = ({ children, className = "" }) => (
  <div
    className={`
    flex items-center justify-end p-4 md:p-5 
    border-t border-gray-200 dark:border-gray-600 rounded-b
    space-x-3
    ${className}
  `}
  >
    {children}
  </div>
);

Modal.Footer.displayName = "Modal.Footer";

let isModalSetupRendered = false;

export const ModalSetup = () => {
  useEffect(() => {
    if (!isModalSetupRendered) {
      document.addEventListener("click", documentClickHandler);
      isModalSetupRendered = true;
    }
    return () => {
      if (isModalSetupRendered) {
        document.removeEventListener("click", documentClickHandler);
        isModalSetupRendered = false;
      }
    };
  }, []);
  return null as React.ReactNode;
};

export const useModal = <T extends RouteParams>(pattern: string) => {
  const open = useCallback(
    (params?: T) => {
      const match = findMatchingModal(pattern);
      if (match) {
        match.handlers.open(params || ({} as T));
      }
    },
    [pattern]
  );

  const close = useCallback(() => {
    const match = findMatchingModal(pattern);
    if (match) {
      match.handlers.close();
    }
  }, [pattern]);

  const toggle = useCallback(
    (params?: T) => {
      const match = findMatchingModal(pattern);
      if (match) {
        match.handlers.toggle(params || ({} as T));
      }
    },
    [pattern]
  );

  return { open, close, toggle };
};

export default Modal;