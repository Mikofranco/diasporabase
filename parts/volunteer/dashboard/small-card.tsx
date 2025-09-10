import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import React from "react";
import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";

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
      className="h-fit max-w-xs"
    >
      <Card className="p-4 shadow-sm rounded-lg bg-white border border-gray-200">
        <CardContent className="p-0">
          <div className="flex items-center gap-4" aria-label={title}>
            <div className="relative w-10 h-10 flex-shrink-0">
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
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-sm">N/A</span>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <p
                ref={countRef}
                className="text-xl font-semibold text-gray-900"
              >
                {count}
              </p>
              <h1 className="text-sm text-gray-500">{title}</h1>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SmallCard;