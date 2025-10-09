import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import { motion, animate } from "framer-motion";

export interface SmallCardProps {
  image?: string;
  title?: string;
  count?: number;
}

const SmallCard = ({ image, count = 0, title = "Untitled" }: SmallCardProps) => {
  // Ref to store and update the animated count
  const countRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (countRef.current) {
      // Animate from 0 to count over 2 seconds
      animate(0, count, {
        duration: 2, // 2-second animation
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
      className="w-full h-fit"
    >
      <Card className="p-4 shadow-sm rounded-lg bg-white border border-gray-200">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 sm:gap-4 py-6" aria-label={title}>
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
              {image ? (
                <Image
                  src={image}
                  alt={title}
                  width={30}
                  height={30}
                  className="object-contain"
                  onError={(e) => (e.currentTarget.src = "/fallback-icon.png")}
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-xs sm:text-sm">N/A</span>
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <p
                ref={countRef}
                className="text-lg sm:text-xl font-semibold text-gray-900"
              >
                {count}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SmallCard;