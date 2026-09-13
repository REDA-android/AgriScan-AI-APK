import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Store,
  Phone,
  MessageSquare,
  Search,
  CheckCircle2,
  Filter,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Truck,
  Users
} from 'lucide-react';

interface MarketplaceModalProps {
  onClose: () => void;
  language?: 'fr' | 'en' | 'ar' | 'es';
}

interface CropPrice {
  id: string;
  name: string;
  category: string;
  icon: string;
  wholesalePrice: number;
  retailPrice: number;
  unit: string;
  changePercent: number; // e.g. +4.2%
  trend: 'up' | 'down' | 'stable';
  marketLocation: string;
}

interface Supplier {
  id: string;
  name: string;
  type: 'buyer' | 'bio-supplier' | 'cooperative' | 'irrigation';
  location: string;
  phone: string;
  whatsapp: string;
  verified: boolean;
  rating: number;
  specialty: string;
}

const CROP_PRICES: CropPrice[] = [
  {
    id: 'olive_oil',
    name: "Huile d'Olive Vierge Extra",
    category: "Oléiculture",
    icon: "🫒",
    wholesalePrice: 85,
    retailPrice: 98,
    unit: "Litre",
    changePercent: 5.4,
    trend: 'up',
    marketLocation: "Fès-Meknès / Marrakech"
  },
  {
    id: 'wheat_durum',
    name: "Blé Dur Sélectionné",
    category: "Céréales",
    icon: "🌾",
    wholesalePrice: 4.8,
    retailPrice: 6.2,
    unit: "Kg",
    changePercent: -1.5,
    trend: 'down',
    marketLocation: "Béni Mellal / Chaouia"
  },
  {
    id: 'tomato_round',
    name: "Tomate Ronde Calibre 1",
    category: "Maraîchage",
    icon: "🍅",
    wholesalePrice: 5.5,
    retailPrice: 8.0,
    unit: "Kg",
    changePercent: 3.2,
    trend: 'up',
    marketLocation: "Souss-Massa (Agadir)"
  },
  {
    id: 'citrus_navel',
    name: "Oranges Navel Thomson",
    category: "Agrumes",
    icon: "🍊",
    wholesalePrice: 4.0,
    retailPrice: 6.5,
    unit: "Kg",
    changePercent: 0.0,
    trend: 'stable',
    marketLocation: "Berkane / Gharb"
  },
  {
    id: 'dates_medjool',
    name: "Dattes Medjool Premium",
    category: "Oasis",
    icon: "🌴",
    wholesalePrice: 110,
    retailPrice: 140,
    unit: "Kg",
    changePercent: 7.8,
    trend: 'up',
    marketLocation: "Drâa-Tafilalet (Errachidia)"
  },
  {
    id: 'potato_spunta',
    name: "Pomme de Terre Spunta",
    category: "Tubercules",
    icon: "🥔",
    wholesalePrice: 3.5,
    retailPrice: 5.0,
    unit: "Kg",
    changePercent: -2.8,
    trend: 'down',
    marketLocation: "Saïss / Doukkala"
  },
  {
    id: 'strawberries',
    name: "Fraises Gariguette & Camarosa",
    category: "Fruits rouges",
    icon: "🍓",
    wholesalePrice: 16.0,
    retailPrice: 22.0,
    unit: "Kg",
    changePercent: 4.1,
    trend: 'up',
    marketLocation: "Loukkos / Larache"
  }
];

const SUPPLIERS_AND_BUYERS: Supplier[] = [
  {
    id: '1',
    name: "Coopérative Oléicole du Saïss",
    type: 'cooperative',
    location: "Meknès, Maroc",
    phone: "+212 535 52 14 00",
    whatsapp: "212661000111",
    verified: true,
    rating: 4.9,
    specialty: "Achat d'olives de trituration au prix du jour & certification BIO"
  },
  {
    id: '2',
    name: "AgriExport Primeurs Souss",
    type: 'buyer',
    location: "Agadir, Maroc",
    phone: "+212 528 84 33 21",
    whatsapp: "212662223344",
    verified: true,
    rating: 4.8,
    specialty: "Export fruits & légumes vers l'Europe & Moyen-Orient, paiement garanti"
  },
  {
    id: '3',
    name: "BioProtect Fertilisants & Biocontrôle",
    type: 'bio-supplier',
    location: "Casablanca / Salé",
    phone: "+212 522 30 40 50",
    whatsapp: "212663334455",
    verified: true,
    rating: 4.7,
    specialty: "Trichoderma, cuivre homologué, purins d'ortie et pièges à phéromones"
  },
  {
    id: '4',
    name: "Goutte d'Or Systèmes d'Irrigation",
    type: 'irrigation',
    location: "Marrakech, Maroc",
    phone: "+212 524 43 12 90",
    whatsapp: "212664445566",
    verified: true,
    rating: 4.9,
    specialty: "Goutte-à-goutte automatisé, sondes capacitives et électrovannes solaires"
  }
];

export const MarketplaceModal: React.FC<MarketplaceModalProps> = ({ onClose, language = 'fr' }) => {
  const [activeTab, setActiveTab] = useState<'prices' | 'contacts'>('prices');
  const [currency, setCurrency] = useState<'MAD' | 'EUR' | 'USD'>('MAD');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [inquiryText, setInquiryText] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  // Currency multiplier
  const currencyRate = currency === 'MAD' ? 1 : currency === 'EUR' ? 0.093 : 0.10;
  const currencySymbol = currency === 'MAD' ? 'DH' : currency === 'EUR' ? '€' : '$';

  const filteredPrices = CROP_PRICES.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.marketLocation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;
    setInquirySent(true);
    setTimeout(() => {
      setInquirySent(false);
      setSelectedSupplier(null);
      setInquiryText('');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-[#0b120e] border border-slate-200 dark:border-emerald-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-100/40 dark:from-emerald-950/80 dark:via-[#0e1a14] dark:to-slate-950/80 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <Store size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  Marché Agricole & Cours du Jour
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-[10px] font-extrabold rounded-md border border-emerald-300 dark:border-emerald-500/30">
                  En direct
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Prix de gros & détail, acheteurs directs et coopératives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab & Currency Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2 text-xs shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('prices')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'prices'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp size={14} />
              <span>Cours des Récoltes</span>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'contacts'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users size={14} />
              <span>Acheteurs & Fournisseurs</span>
            </button>
          </div>

          {/* Currency Toggle */}
          <div className="flex bg-slate-200/80 dark:bg-black/40 p-0.5 rounded-xl border border-slate-300 dark:border-white/10 font-bold text-[10px]">
            {(['MAD', 'EUR', 'USD'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  currency === curr ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: CROP PRICES */}
          {activeTab === 'prices' && (
            <div className="space-y-4">
              {/* Search filter */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une récolte, céréale, huile ou marché..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Price Cards List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPrices.map((item) => {
                  const wholesale = (item.wholesalePrice * currencyRate).toFixed(1);
                  const retail = (item.retailPrice * currencyRate).toFixed(1);
                  const isUp = item.trend === 'up';
                  const isDown = item.trend === 'down';

                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 hover:bg-slate-100/90 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 rounded-2xl transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{item.name}</h4>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400">{item.category} • {item.marketLocation}</p>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isUp
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isDown
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-slate-500/20 text-slate-300'
                        }`}>
                          {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : null}
                          {isUp ? `+${item.changePercent}%` : `${item.changePercent}%`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-center">
                        <div className="p-2 bg-black/40 rounded-xl">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Prix de Gros</span>
                          <span className="text-sm font-black text-emerald-400">
                            {wholesale} {currencySymbol} <span className="text-[10px] font-normal text-slate-400">/{item.unit}</span>
                          </span>
                        </div>

                        <div className="p-2 bg-black/40 rounded-xl">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Prix Détail</span>
                          <span className="text-sm font-black text-slate-200">
                            {retail} {currencySymbol} <span className="text-[10px] font-normal text-slate-400">/{item.unit}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT BUYERS & SUPPLIERS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                  <ShieldCheck size={16} /> Réseau Vérifié de Partenaires Agricoles
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Connectez-vous directement via WhatsApp ou appel vocal avec des acheteurs agréés, usines de trituration, et coopératives pour écouler vos récoltes au meilleur tarif.
                </p>
              </div>

              <div className="space-y-3">
                {SUPPLIERS_AND_BUYERS.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white">{supplier.name}</h4>
                          {supplier.verified && (
                            <span className="p-0.5 bg-emerald-500/20 text-emerald-400 rounded-full" title="Acheteur vérifié">
                              <CheckCircle2 size={13} />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-400 font-bold mt-0.5">{supplier.location}</p>
                        <p className="text-xs text-slate-300 mt-1">{supplier.specialty}</p>
                      </div>

                      <span className="px-2 py-1 bg-white/10 rounded-xl text-xs font-bold text-amber-300">
                        ⭐ {supplier.rating}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <a
                        href={`https://wa.me/${supplier.whatsapp}?text=Bonjour%2C%20je%20vous%20contacte%20via%20AgriScan%20AI%20concernant%20mes%20r%C3%A9coltes.`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98"
                      >
                        <MessageSquare size={14} />
                        <span>WhatsApp Direct</span>
                      </a>

                      <a
                        href={`tel:${supplier.phone.replace(/\s+/g, '')}`}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Phone size={14} />
                        <span>Appeler</span>
                      </a>

                      <button
                        onClick={() => setSelectedSupplier(supplier)}
                        className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-all"
                      >
                        Offre
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Supplier Contact Form */}
        <AnimatePresence>
          {selectedSupplier && (
            <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#121915] border border-emerald-500/40 w-full max-w-md rounded-3xl p-5 text-slate-100 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="text-sm font-black text-white">
                    Envoyer une proposition à {selectedSupplier.name}
                  </h4>
                  <button onClick={() => setSelectedSupplier(null)} className="text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                {inquirySent ? (
                  <div className="p-6 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={24} />
                    </div>
                    <p className="text-sm font-bold text-white">Demande transmise avec succès !</p>
                    <p className="text-xs text-slate-400">Le partenaire vous contactera directement sous 24h.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendInquiry} className="space-y-3 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Détails de votre offre (Culture, Tonnage, Qualité, Localisation) :
                      </label>
                      <textarea
                        rows={4}
                        value={inquiryText}
                        onChange={(e) => setInquiryText(e.target.value)}
                        placeholder="Ex: Je dispose de 15 tonnes d'olives Picholine récoltées à la main avec certificat sanitaire AgriScan..."
                        className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSupplier(null)}
                        className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl font-bold text-slate-300"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Send size={13} />
                        <span>Transmettre</span>
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Données actualisées sur les marchés de gros nationaux et régionaux.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md active:scale-95"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MarketplaceModal;
