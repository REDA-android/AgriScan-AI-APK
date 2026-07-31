import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, MapPin, Wind, Cloud, Droplets, Thermometer, ChevronRight, Plus, RefreshCw, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Observation, WeatherData } from '../types';
import { LiquidCard, LiquidButton, LiquidBadge } from './LiquidGlass';

interface DashboardProps {
  observations: Observation[];
  weather: WeatherData | null;
  t: any;
  onScan: () => void;
  onViewMap: () => void;
  onViewCatalog: () => void;
  onExport: () => void;
  onRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  observations, 
  weather, 
  t, 
  onScan, 
  onViewMap, 
  onViewCatalog, 
  onExport, 
  onRefresh 
}) => {
  const stats = React.useMemo(() => {
    const total = observations.length;
    const completed = observations.filter(o => o.status === 'completed').length;
    const analyzing = observations.filter(o => o.status === 'analyzing').length;
    const error = observations.filter(o => o.status === 'error').length;
    
    const cultures = observations.reduce((acc: any, o) => {
      acc[o.culture] = (acc[o.culture] || 0) + 1;
      return acc;
    }, {});

    return { total, completed, analyzing, error, cultures };
  }, [observations]);

  const chartData = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => ({
      date: date.split('-').slice(1).reverse().join('/'),
      count: observations.filter(o => o.capturedAt.startsWith(date)).length
    }));
  }, [observations]);

  return (
    <div className="space-y-6 pb-28">
      {/* Header Section */}
      <div className="flex justify-between items-center px-4 pt-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{t.title}</h1>
          <p className="text-xs text-slate-400 font-medium">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <LiquidButton onClick={onRefresh} size="sm" className="!p-2.5 !rounded-full">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
          </LiquidButton>
          <LiquidButton onClick={onExport} size="sm" className="!p-2.5 !rounded-full">
            <Download className="w-4 h-4 text-emerald-400" />
          </LiquidButton>
        </div>
      </div>

      {/* Quick Actions Grid - Liquid Glass Buttons */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onScan}
          className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-2xl border border-emerald-400/30 rounded-[24px] shadow-[0_12px_36px_rgba(16,185,129,0.25),inset_0_1px_1px_rgba(255,255,255,0.3)] group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-emerald-300" />
          </div>
          <span className="font-black text-sm tracking-wide text-white">{t.scan}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onViewMap}
          className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-2xl border border-blue-400/30 rounded-[24px] shadow-[0_12px_36px_rgba(59,130,246,0.25),inset_0_1px_1px_rgba(255,255,255,0.3)] group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <MapPin className="w-6 h-6 text-blue-300" />
          </div>
          <span className="font-black text-sm tracking-wide text-white">{t.map}</span>
        </motion.button>
      </div>

      {/* Weather Widget */}
      {weather && (
        <div className="mx-4">
          <LiquidCard className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-400" />
                {t.weather}
              </h2>
              <LiquidBadge variant="blue">
                {weather.description}
              </LiquidBadge>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <Thermometer className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-base font-black text-white">{weather.temp}°</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.temp}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <Droplets className="w-4 h-4 text-blue-400 mb-1" />
                <span className="text-base font-black text-white">{weather.humidity}%</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.humidity}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <Wind className="w-4 h-4 text-slate-300 mb-1" />
                <span className="text-base font-black text-white">{weather.wind}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.wind}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <Cloud className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-base font-black text-white">{weather.precip}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.precip}</span>
              </div>
            </div>
          </LiquidCard>
        </div>
      )}

      {/* Stats & Chart */}
      <div className="mx-4">
        <LiquidCard className="p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            {t.recent}
          </h2>
          <div className="h-40 w-full mb-6 min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(13, 18, 15, 0.9)', backdropFilter: 'blur(16px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-black text-white">{stats.total}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center">
              <span className="block text-xl font-black text-emerald-400">{stats.completed}</span>
              <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider">OK</span>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-center">
              <span className="block text-xl font-black text-blue-400">{stats.analyzing}</span>
              <span className="text-[9px] text-blue-300 font-bold uppercase tracking-wider">IA</span>
            </div>
          </div>
        </LiquidCard>
      </div>

      {/* Recent Observations List Preview */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-white text-lg">{t.catalog}</h2>
          <button 
            onClick={onViewCatalog}
            className="text-xs font-bold text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
          >
            {t.viewCatalog} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {observations.slice(0, 3).map(obs => (
            <motion.div 
              key={obs.id}
              whileHover={{ scale: 1.01, y: -1 }}
              onClick={onViewCatalog}
              className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-lg cursor-pointer hover:bg-white/10 transition-all"
            >
              <img 
                src={obs.imageUrl} 
                className="w-12 h-12 rounded-xl object-cover bg-white/5 border border-white/10" 
                referrerPolicy="no-referrer"
              />
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-white truncate">{obs.variety || obs.culture}</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                  <MapPin className="w-3 h-3 text-emerald-400" /> {obs.domain}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
