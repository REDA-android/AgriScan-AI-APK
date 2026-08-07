import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Liquid Glass SVG Filter Definitions
 * Inspired by Liquid-Glass-CSS, awesome-liquid-glass, liquid-glass-react, glinui & liquid-glass-js.
 * Provides SVG filters for gooey fluid morphing, refraction specular sheen, and glass blur.
 */
export const LiquidGlassSVG = () => (
  <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
    <defs>
      {/* Gooey fluid morphing filter */}
      <filter id="liquid-goo">
        <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
        <feColorMatrix
          in="blur"
          mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"
          result="goo"
        />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>

      {/* Gentle liquid goo filter for tabs and small buttons */}
      <filter id="liquid-goo-light">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
        <feColorMatrix
          in="blur"
          mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 14 -5"
          result="goo"
        />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>

      {/* Glass specular refraction highlights */}
      <filter id="liquid-refraction" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
);

/**
 * Animated Ambient Liquid Background Orbs
 */
export const LiquidBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-60 dark:opacity-40">
      <div className="absolute inset-0 bg-[#0d120f] transition-colors duration-700" />
      
      {/* Primary Emerald Fluid Blob */}
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -80, 40, 0],
          scale: [1, 1.25, 0.9, 1],
          rotate: [0, 120, 240, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-[15%] -left-[10%] w-[65%] h-[65%] bg-emerald-500/25 blur-[130px] rounded-full"
      />
      
      {/* Secondary Cyan/Blue Fluid Blob */}
      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 120, -80, 0],
          scale: [1, 0.85, 1.15, 1],
          rotate: [0, -120, -240, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-teal-500/20 blur-[160px] rounded-full"
      />
      
      {/* Tertiary Deep Purple Accent Blob */}
      <motion.div
        animate={{
          x: [0, 150, -100, 0],
          y: [0, 150, -150, 0],
          scale: [1, 1.3, 0.75, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[25%] right-[5%] w-[45%] h-[45%] bg-emerald-400/10 blur-[110px] rounded-full"
      />
    </div>
  );
};

/**
 * Liquid Glass Card Container
 * Features multi-layered specular borders, frosted blur, and hover refraction glare
 */
export const LiquidCard = ({
  children,
  className = "",
  onClick,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}) => {
  return (
    <motion.div
      whileHover={interactive ? { y: -2, scale: 1.01 } : undefined}
      whileTap={interactive ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-[28px]
        bg-white/[0.06] dark:bg-white/[0.05]
        backdrop-blur-2xl webkit-backdrop-blur-xl
        border border-white/15 dark:border-white/10
        shadow-[0_16px_40px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)]
        transition-all duration-300
        ${interactive ? "cursor-pointer hover:border-emerald-400/40 hover:bg-white/[0.09]" : ""}
        ${className}
      `}
    >
      {/* Top Glass Reflection Sheen */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

/**
 * Liquid Glass Interactive Button
 * Features fluid spring physics, glare sweep, and glowing specular border
 */
export const LiquidButton = ({
  children,
  onClick,
  className = "",
  primary = false,
  disabled = false,
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  primary?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs rounded-xl",
    md: "px-6 py-3 text-sm rounded-2xl",
    lg: "px-8 py-4 text-base rounded-3xl",
  }[size];

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden font-bold transition-all duration-300 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses}
        ${
          primary
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-emerald-300/40 hover:shadow-[0_15px_40px_rgba(16,185,129,0.5),inset_0_1px_1px_rgba(255,255,255,0.6)]"
            : "bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/15 dark:border-white/10 text-white hover:bg-white/15 hover:border-white/25 shadow-[0_8px_25px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)]"
        }
        ${className}
      `}
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>

      {/* Glare Sheen animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full pointer-events-none"
        whileHover={{ x: ["-100%", "100%"] }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      />
    </motion.button>
  );
};

/**
 * Liquid Glass Badge / Pill
 */
export const LiquidBadge = ({
  children,
  variant = "emerald",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "emerald" | "blue" | "amber" | "purple" | "neutral";
  className?: string;
}) => {
  const variantStyles = {
    emerald: "bg-emerald-500/15 border-emerald-400/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    blue: "bg-blue-500/15 border-blue-400/30 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
    amber: "bg-amber-500/15 border-amber-400/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    purple: "bg-purple-500/15 border-purple-400/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]",
    neutral: "bg-white/10 border-white/15 text-slate-200 shadow-[0_0_15px_rgba(255,255,255,0.1)]",
  }[variant];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
        backdrop-blur-xl border inset-0
        transition-all duration-300
        ${variantStyles}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

/**
 * Liquid Glass Jello Slider
 * Interactive slider inspired by awesome-liquid-glass slider
 */
export const LiquidGlassSlider = ({
  value,
  min = 0,
  max = 100,
  onChange,
  label,
  unit = "",
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
}) => {
  const percentage = Math.round(((value - min) / (max - min)) * 100);

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-xs font-bold">
          <span className="text-slate-300">{label}</span>
          <span className="text-emerald-400 font-mono">
            {value}
            {unit}
          </span>
        </div>
      )}
      <div className="relative flex items-center h-8">
        <div className="absolute inset-x-0 h-3 bg-white/10 backdrop-blur-md rounded-full border border-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-glass relative z-10 w-full opacity-0 cursor-pointer"
        />
        {/* Floating Jello Glass Handle Indicator */}
        <motion.div
          className="absolute pointer-events-none w-7 h-7 rounded-xl bg-white/90 backdrop-blur-2xl border border-white shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center justify-center -translate-x-1/2"
          style={{ left: `${percentage}%` }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </motion.div>
      </div>
    </div>
  );
};

/**
 * Liquid Glass Floating Modal Overlay
 */
/**
 * Liquid Glass Tab Bar
 * Features squash-and-stretch fluid motion for the active indicator
 */
export const LiquidTabBar = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: {
  tabs: { id: string; icon: React.ReactNode; label: string; primary?: boolean }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}) => {
  return (
    <nav
      className={`fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-2 right-2 sm:left-4 sm:right-4 max-w-[380px] xl:max-w-md mx-auto bg-white/90 dark:bg-[#161c18]/90 backdrop-blur-3xl border border-slate-200/90 dark:border-white/10 p-1 rounded-[2rem] flex justify-between items-center z-50 shadow-[0_12px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (tab.primary) {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="relative -top-5 group outline-none cursor-pointer flex flex-col items-center shrink-0 px-0.5"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-3 sm:p-3.5 rounded-full shadow-[0_10px_25px_rgba(16,185,129,0.4)] transition-all duration-300 ${
                  isActive
                    ? "bg-emerald-500 scale-110 ring-4 ring-emerald-500/20"
                    : "bg-emerald-500 hover:scale-105"
                }`}
              >
                <div className="text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                  {tab.icon}
                </div>
              </motion.div>
              <span
                className={`liquid-tab-bar-item-label ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 opacity-100"
                    : "text-slate-600 dark:text-slate-400 opacity-80"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center justify-center flex-1 max-w-[62px] sm:max-w-[72px] h-11 z-10 transition-colors duration-200 outline-none cursor-pointer px-0.5 ${
              isActive
                ? "liquid-tab-bar-active text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="liquid-tab-indicator"
                className="absolute inset-x-0.5 inset-y-0.5 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-400/30 shadow-sm rounded-2xl -z-10"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 28,
                  mass: 0.8,
                }}
              />
            )}
            <div className="flex flex-col items-center justify-center w-full min-w-0">
              <motion.div
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex items-center justify-center z-10 shrink-0"
              >
                {tab.icon}
              </motion.div>
              <span
                className={`liquid-tab-bar-item-label ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {tab.label}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );
};

/**
 * Liquid Glass Floating Modal Overlay
 */
export const LiquidModal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative z-10 w-full max-w-md"
          >
            <LiquidCard className="p-6">
              {title && (
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                  <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
              {children}
            </LiquidCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * Liquid Floating Menu
 * Features squash-and-stretch fluid motion when opened
 */
export const LiquidFloatingMenu = ({
  icon,
  items,
  className = "",
  isOpen,
  setIsOpen,
}: {
  icon: React.ReactNode;
  items: { id: string; icon: React.ReactNode; label: string; onClick: () => void }[];
  className?: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Container with gooey filter for smooth liquid merging between items */}
      <div 
        className="relative z-10 flex flex-col items-center justify-end"
        style={{ filter: "url(#liquid-goo-light)" }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.5 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.5 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
              className="flex flex-col gap-3 mb-3 origin-bottom"
            >
              {items.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className="group relative w-12 h-12 rounded-full bg-emerald-500/80 backdrop-blur-md border border-emerald-400/50 flex items-center justify-center text-white shadow-lg hover:bg-emerald-400 transition-colors outline-none cursor-pointer"
                >
                  {item.icon}
                  {/* Tooltip */}
                  <span className="absolute right-full mr-4 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scaleY: 0.8, scaleX: 1.15 }} // Squash and stretch
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_10px_25px_rgba(16,185,129,0.5)] z-20 origin-bottom outline-none cursor-pointer transition-colors duration-300 ${isOpen ? 'bg-red-500 border-red-400/50 shadow-[0_10px_25px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 border-emerald-400/50'}`}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 135 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {icon}
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
};

/**
 * Liquid Action Button
 * Interacts fluidly with its background using gooey filters
 */
export const LiquidPlayButton = ({
  onClick,
  icon,
  className = "",
  isActive = false,
}: {
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  isActive?: boolean;
}) => {
  return (
    <div 
      className={`relative flex items-center justify-center p-8 ${className}`}
      style={{ filter: "url(#liquid-goo-light)" }}
    >
      {/* Background pulsating blob */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.4, 1.1] : [1, 1.05, 1],
          opacity: isActive ? 0.9 : 0.4,
        }}
        transition={{
          duration: isActive ? 1.5 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute inset-0 rounded-full blur-md ${isActive ? 'bg-emerald-400' : 'bg-emerald-500/50'}`}
      />
      
      {/* Main Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.85 }}
        onClick={onClick}
        className="relative z-10 w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl outline-none cursor-pointer"
      >
        <motion.div
           animate={{ scale: isActive ? 0.9 : 1 }}
           className="drop-shadow-lg"
        >
          {icon || (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              {isActive ? (
                <>
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </>
              ) : (
                <path d="M8 5v14l11-7z" />
              )}
            </svg>
          )}
        </motion.div>
      </motion.button>
    </div>
  );
};

/**
 * Liquid Overlapping Glass Cards
 * Cards that overlap and merge their glass styling
 */
export const LiquidOverlappingCards = ({
  cards,
  className = "",
  onCardClick,
}: {
  cards: { id: string; title: string; subtitle: string; image?: string; color?: string }[];
  className?: string;
  onCardClick?: (id: string) => void;
}) => {
  return (
    <div className={`relative h-[220px] w-full flex items-center justify-center perspective-1000 ${className}`}>
      {cards.slice(0, 3).map((card, index) => {
        // Calculate spread
        const isCenter = index === 1;
        const isLeft = index === 0;
        const isRight = index === 2;
        
        let xOffset = 0;
        let yOffset = 0;
        let rotate = 0;
        let scale = 1;
        let zIndex = 10;
        
        if (cards.length === 1) {
          xOffset = 0;
          rotate = 0;
          scale = 1;
          zIndex = 30;
        } else if (cards.length === 2) {
          xOffset = index === 0 ? -20 : 20;
          rotate = index === 0 ? -5 : 5;
          yOffset = 10;
          scale = 0.95;
          zIndex = index === 0 ? 20 : 10;
        } else {
          xOffset = isLeft ? -60 : isRight ? 60 : 0;
          yOffset = isCenter ? 0 : 20;
          rotate = isLeft ? -10 : isRight ? 10 : 0;
          scale = isCenter ? 1 : 0.85;
          zIndex = isCenter ? 30 : isLeft ? 20 : 10;
        }
        
        return (
          <motion.div
            key={card.id}
            initial={{ x: 0, y: 50, opacity: 0 }}
            animate={{ x: xOffset, y: yOffset, rotate: rotate, scale: scale, opacity: 1 }}
            whileHover={{ 
              y: yOffset - 15, 
              scale: scale * 1.05, 
              zIndex: 50,
              rotate: 0,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}
            onClick={() => onCardClick?.(card.id)}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.1 }}
            className={`
              absolute w-44 h-52 rounded-3xl p-4 cursor-pointer
              bg-white/10 backdrop-blur-2xl border border-white/20
              shadow-[0_15px_35px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)]
              flex flex-col justify-end overflow-hidden
            `}
            style={{ zIndex, mixBlendMode: "normal" }}
          >
            {/* Background Image if provided */}
            {card.image && (
              <div className="absolute inset-0 -z-10">
                <img src={card.image} alt={card.title} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d120f] via-[#0d120f]/60 to-transparent" />
              </div>
            )}
            
            {/* Color Blob if no image */}
            {!card.image && card.color && (
              <div 
                className={`absolute inset-0 opacity-30 rounded-3xl blur-2xl ${card.color} pointer-events-none -z-10`} 
              />
            )}

            {/* Specular highlight */}
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl z-20" />
            
            <div className="relative z-10">
              <h4 className="text-white font-black text-sm leading-tight drop-shadow-md">{card.title}</h4>
              <p className="text-emerald-300 text-[9px] font-black uppercase tracking-wider mt-1 drop-shadow-md">{card.subtitle}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
