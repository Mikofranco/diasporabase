import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import React from "react";
import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";

export interface SmallCardProps {
  image?: string;
  /** Optional React node (e.g. Lucide icon) – used instead of image when provided */
  icon?: React.ReactNode;
  title?: string;
  count?: number;
}

const SmallCard = ({ image, icon, count = 0, title = "Untitled" }: SmallCardProps) => {
  const countRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (countRef.current) {
      animate(0, count, {
        duration: 2,
        ease: "easeOut",
        onUpdate: (latest) => {
          if (countRef.current) {
            countRef.current.textContent = Math.round(latest).toString();
          }
        },
      });
    }
  }, [count]);

  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
      className="h-fit min-w-0"
    >
      <Card className="p-5 sm:p-6 shadow-sm rounded-xl bg-white border border-slate-200 min-h-[100px]">
        <CardContent className="p-0">
          <div className="flex items-center justify-between gap-4" aria-label={title}>
            <div className="flex flex-col min-w-0">
              <p
                ref={countRef}
                className="text-2xl font-bold text-slate-900 tabular-nums"
              >
                {count}
              </p>
              <h2 className="text-sm font-medium text-slate-600 mt-0.5">{title}</h2>
            </div>
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              {icon !== undefined ? (
                icon
              ) : image ? (
                <Image
                  src={image}
                  alt={title}
                  width={28}
                  height={28}
                  className="object-contain"
                />
              ) : (
                <span className="text-slate-400 text-xs">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SmallCard;