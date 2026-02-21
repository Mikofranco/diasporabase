import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import React from "react";
import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";

export interface SmallCardProps {
  image?: string;
  icon?: React.ReactNode;
  title?: string;
  count?: number;
}

const SmallCard = ({ image, icon, count = 0, title = "Untitled" }: SmallCardProps) => {
  const countRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (countRef.current) {
      animate(0, count, {
        duration: 1.5,
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
      whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)" }}
      className="h-fit min-w-0"
    >
      <Card className="p-4 sm:p-5 md:p-6 lg:p-7 shadow-sm rounded-lg sm:rounded-xl bg-white border border-gray-200/90">
        <CardContent className="p-0">
          <div className="flex items-center justify-between gap-3 sm:gap-5" aria-label={title}>
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 flex-1">
              <p
                ref={countRef}
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tabular-nums"
              >
                {count}
              </p>
              <h2 className="text-xs sm:text-sm lg:text-base font-medium text-gray-500 truncate">{title}</h2>
            </div>
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl bg-muted/60 flex items-center justify-center">
              {icon ? (
                <span className="[&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-7 sm:[&>svg]:h-7 lg:[&>svg]:w-8 lg:[&>svg]:h-8 text-muted-foreground [&>svg]:text-primary/80">
                  {icon}
                </span>
              ) : image ? (
                <Image
                  src={image}
                  alt={title}
                  width={32}
                  height={32}
                  className="object-contain w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
                />
              ) : (
                <span className="text-gray-400 text-sm">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SmallCard;