"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type Beam = {
  path: string;
  delay: number;
  reverse?: boolean;
  points: ReadonlyArray<{ cx: number; cy: number }>;
};

export interface PulseBeamsProps {
  className?: string;
  variant?: "hero" | "panel";
}

const heroBeams: ReadonlyArray<Beam> = [
  {
    path: "M-28 136H128C149 136 166 153 166 174V292C166 313 183 330 204 330H366",
    delay: 0,
    points: [{ cx: 366, cy: 330 }],
  },
  {
    path: "M886 164H730C709 164 692 181 692 202V292C692 313 675 330 654 330H492",
    delay: 1.15,
    reverse: true,
    points: [{ cx: 492, cy: 330 }],
  },
  {
    path: "M-28 560H116C137 560 154 577 154 598V806C154 827 171 844 192 844H260",
    delay: 2.2,
    points: [{ cx: 260, cy: 844 }],
  },
  {
    path: "M886 520H742C721 520 704 537 704 558V766C704 787 687 804 666 804H598",
    delay: 0.65,
    reverse: true,
    points: [{ cx: 598, cy: 804 }],
  },
  {
    path: "M-28 1038H176C197 1038 214 1021 214 1000V934C214 913 231 896 252 896H310",
    delay: 1.6,
    points: [{ cx: 310, cy: 896 }],
  },
  {
    path: "M886 1082H682C661 1082 644 1065 644 1044V978C644 957 627 940 606 940H548",
    delay: 2.75,
    reverse: true,
    points: [{ cx: 548, cy: 940 }],
  },
  {
    path: "M-28 402H196C217 402 234 419 234 440V520C234 541 251 558 272 558H352",
    delay: 0.4,
    points: [{ cx: 352, cy: 558 }],
  },
  {
    path: "M886 368H710C689 368 672 385 672 406V468C672 489 655 506 634 506H560",
    delay: 1.9,
    reverse: true,
    points: [{ cx: 560, cy: 506 }],
  },
  {
    path: "M-28 700H88C109 700 126 683 126 662V624C126 603 143 586 164 586H236",
    delay: 3.1,
    points: [{ cx: 236, cy: 586 }],
  },
  {
    path: "M886 668H766C745 668 728 685 728 706V888C728 909 711 926 690 926H626",
    delay: 2.45,
    reverse: true,
    points: [{ cx: 626, cy: 926 }],
  },
];

const panelBeams: ReadonlyArray<Beam> = [
  {
    path: "M-36 82H224C245 82 262 99 262 120V212C262 233 279 250 300 250H438",
    delay: 0.25,
    points: [{ cx: 438, cy: 250 }],
  },
  {
    path: "M894 122H674C653 122 636 139 636 160V218C636 239 619 256 598 256H508",
    delay: 1.45,
    points: [{ cx: 508, cy: 256 }],
  },
  {
    path: "M168 468V370C168 349 185 332 206 332H374C395 332 412 315 412 294V272",
    delay: 2.35,
    points: [{ cx: 412, cy: 272 }],
  },
];

export function PulseBeams({
  className,
  variant = "hero",
}: PulseBeamsProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const rawId = useId();
  const id = rawId.replace(/:/g, "");
  const beams = variant === "panel" ? panelBeams : heroBeams;
  const viewBox = variant === "hero" ? "0 0 858 1180" : "0 0 858 434";
  const preserveAspectRatio =
    variant === "hero" ? "xMidYMin meet" : "xMidYMid slice";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      <svg
        className="h-full w-full"
        viewBox={viewBox}
        fill="none"
        preserveAspectRatio={preserveAspectRatio}
        xmlns="http://www.w3.org/2000/svg"
      >
        {beams.map((beam, index) => (
          <g key={beam.path}>
            <path
              d={beam.path}
              stroke="currentColor"
              strokeOpacity="0.13"
              strokeWidth="1"
            />
            <path
              d={beam.path}
              stroke={`url(#pulse-${id}-${index})`}
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            {beam.points.map((point) => (
              <circle
                key={`${point.cx}-${point.cy}`}
                cx={point.cx}
                cy={point.cy}
                r="4"
                fill="#f9f9f8"
                stroke="#2dd4bf"
                strokeOpacity="0.45"
              />
            ))}
          </g>
        ))}

        <defs>
          {beams.map((beam, index) => (
            <motion.linearGradient
              key={beam.path}
              id={`pulse-${id}-${index}`}
              gradientUnits="userSpaceOnUse"
              initial={{
                x1: beam.reverse ? "135%" : "-35%",
                x2: beam.reverse ? "105%" : "-5%",
                y1: "0%",
                y2: "20%",
              }}
              animate={
                reducedMotion
                  ? { x1: "25%", x2: "65%", y1: "25%", y2: "65%" }
                  : {
                      x1: beam.reverse
                        ? ["135%", "55%", "-20%"]
                        : ["-35%", "45%", "120%"],
                      x2: beam.reverse
                        ? ["105%", "25%", "-50%"]
                        : ["-5%", "75%", "150%"],
                      y1: ["0%", "45%", "100%"],
                      y2: ["20%", "65%", "120%"],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      duration: 3.4,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "linear",
                      repeatDelay: 1.8,
                      delay: beam.delay,
                    }
              }
            >
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0" />
              <stop offset="24%" stopColor="#2dd4bf" stopOpacity="0.75" />
              <stop offset="58%" stopColor="#60a5fa" stopOpacity="0.68" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
            </motion.linearGradient>
          ))}
        </defs>
      </svg>
    </div>
  );
}
