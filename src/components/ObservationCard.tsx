import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Observation } from '../types';

interface ObservationCardProps {
  observation: Observation;
  onClick: () => void;
  t: any;
}

const ObservationCard: React.FC<ObservationCardProps> = ({ observation, onClick, t }) => {
  const getStatusIcon = () => {
    switch (observation.status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'analyzing': return <Clock className="w-4 h-4 text-blue-400 animate-pulse" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusGlow = () => {
    switch (observation.status) {
      case 'completed': return 'border-emerald-500/30 hover:border-emerald-400/50 shadow-[0_8px_32px_rgba(16,185,129,0.15)]';
      case 'error': return 'border-red-500/30 hover:border-red-400/50 shadow-[0_8px_32px_rgba(239,68,68,0.15)]';
      case 'analyzing': return 'border-blue-500/30 hover:border-blue-400/50 shadow-[0_8px_32px_rgba(59,130,246,0.15)]';
      default: return 'border-white/10 hover:border-white/20';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all duration-300
        bg-white/[0.06] backdrop-blur-2xl webkit-backdrop-blur-xl
        border shadow-[0_12px_36px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]
        ${getStatusGlow()}
      `}
    >
      {/* Top Glass Specular Reflection */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      <div className="flex gap-4">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white/5 border border-white/10 shadow-inner">
          <img
            src={observation.imageUrl}
            alt={observation.variety}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-1 right-1 p-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
            {getStatusIcon()}
          </div>
        </div>

        <div className="flex flex-col justify-between flex-grow min-w-0">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-white truncate text-base leading-tight">
                {observation.variety || observation.culture || t.pending}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/15 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-400/30 flex-shrink-0">
                {observation.bbchDominant || 'BBCH --'}
              </span>
            </div>
            
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">{observation.domain}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Calendar className="w-3 h-3 text-slate-500" />
              {new Date(observation.capturedAt).toLocaleDateString()}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
      
      {observation.status === 'analyzing' && (
        <div className="absolute bottom-0 left-0 h-1 bg-blue-500 animate-[shimmer_2s_infinite]" style={{ width: '100%' }} />
      )}
    </motion.div>
  );
};

export default ObservationCard;
