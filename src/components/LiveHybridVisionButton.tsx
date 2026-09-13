import React from "react";
import { motion } from "motion/react";
import { Camera, Sparkles, Zap, Activity } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

interface LiveHybridVisionButtonProps {
  onClick: () => void;
  className?: string;
  badgeText?: string;
}

export const LiveHybridVisionButton: React.FC<LiveHybridVisionButtonProps> = ({
  onClick,
  className = "",
  badgeText = "Vision Végétale & Gemini 3.8",
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        triggerHaptic("medium");
        onClick();
      }}
      className={`
        group relative overflow-hidden cursor-pointer
        px-4 sm:px-5 py-2.5 sm:py-3 rounded-full
        bg-slate-950/75 dark:bg-black/80
        backdrop-blur-2xl webkit-backdrop-blur-xl
        border border-emerald-400/40 dark:border-emerald-400/30
        shadow-[0_12px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]
        hover:border-emerald-300/70 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(16,185,129,0.5),inset_0_1px_1px_rgba(255,255,255,0.6)]
        transition-all duration-300 flex items-center gap-3 select-none text-left
        ${className}
      `}
      aria-label="Lancer la Vision Caméra IA & Détection Végétale"
    >
      {/* Specular Top Glass Highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent pointer-events-none" />

      {/* Subtle Breathing Fluid Glow */}
      <motion.div
        animate={{
          opacity: [0.35, 0.75, 0.35],
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/25 to-emerald-500/20 rounded-full blur-md pointer-events-none -z-10"
      />

      {/* Animated Glare Sweep on Hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full pointer-events-none"
        whileHover={{ x: ["-100%", "200%"] }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      {/* Animated Camera Icon with Radar Pulse */}
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Pulsing Concentric Radar Rings */}
        <span className="absolute w-10 h-10 rounded-full bg-emerald-400/25 animate-ping opacity-60 pointer-events-none" />
        <span className="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-pulse pointer-events-none" />

        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.5)] border border-emerald-300/60">
          <Camera size={19} className="drop-shadow-sm group-hover:scale-110 transition-transform duration-200" />
        </div>
      </div>

      {/* Label and Live Status Badge */}
      <div className="flex flex-col min-w-0 pr-1">
        <div className="flex items-center gap-1.5 leading-tight">
          <span className="text-xs sm:text-sm font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
            Vision Caméra IA
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[9px] sm:text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)] whitespace-nowrap">
            <Activity size={10} className="text-emerald-400 animate-pulse shrink-0" />
            {badgeText}
          </span>
        </div>
      </div>

      {/* Right Action Badge / Sparkle */}
      <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-white/10 border border-white/15 text-emerald-300 shrink-0 shadow-inner group-hover:bg-emerald-500/20 group-hover:border-emerald-400/40 transition-colors">
        <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
      </div>
    </motion.button>
  );
};

export default LiveHybridVisionButton;
