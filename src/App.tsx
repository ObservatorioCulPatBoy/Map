import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Landmark, 
  Flag,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  BarChart3,
  LayoutDashboard,
  Trophy,
  Map,
  Building2,
  MapPin,
  FileText,
  Shield,
  Tag,
  X,
  Award,
  ShieldCheck,
  Package
} from 'lucide-react';
import { 
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList
} from 'recharts';
import { MunicipalityData } from './types';
import { loadMunicipalityData } from './services/dataService';
import MapComponent from './components/MapComponent';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
const diagnosticoPdf = '/Diagnostico.pdf';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

//function toTitleCase(str: string): string {
  //if (!str) return str;
  //return str
    //.toLowerCase()
    //.replace(/\b\w/g, (char) => char.toUpperCase());
//}

function toTitleCase(text: string): string {
  if (!text) return text;

  const lowerWords = new Set([
    "de", "del", "la", "las", "el", "los",
    "y", "e", "o", "u", "al"
  ]);
  return text
    .toLocaleLowerCase("es")
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      if (lowerWords.has(word) && index !== 0) {
        return word;
      }
      return word
        .split(/([-'])/) // mantiene guiones y apóstrofes
        .map(part =>
          part === "-" || part === "'"
            ? part
            : part.charAt(0).toLocaleUpperCase("es") + part.slice(1)
        )
        .join("");
    })
    .join(" ");
}

function BICImage({ name }: { name: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
      <Landmark size={14} />
    </div>
  );
}

export default function App() {
  const [baseData, setBaseData] = useState<MunicipalityData[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalityData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats'>('dashboard');
  const [viewLevel, setViewLevel] = useState<'municipal' | 'provincial' | 'departamental'>('municipal');
  const [dashboardProvince, setDashboardProvince] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });
  const [showPappModal, setShowPappModal] = useState(false);
  const [showNecesidadesModal, setShowNecesidadesModal] = useState(false);
  const [selectedBicForDetail, setSelectedBicForDetail] = useState<any | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const CAROUSEL_TOTAL = 4;
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setWindowWidth(window.innerWidth), 150);
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const base = await loadMunicipalityData();
        setBaseData(base);
        if (base.length > 0) {
          setSelectedMunicipality(base[0]);
          setDashboardProvince(base[0].province);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const municipalities = baseData;

  useEffect(() => {
    if (!selectedMunicipality || municipalities.length === 0) return;
    const updated = municipalities.find((m) => m.id === selectedMunicipality.id);
    if (updated && updated !== selectedMunicipality) setSelectedMunicipality(updated);
  }, [municipalities]);

  const filteredMunicipalities = municipalities.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isGlobal = viewLevel === 'departamental';
  const isProvincial = viewLevel === 'provincial';

  const globalData = useMemo(() => {
    if (municipalities.length === 0) return null;

    const totalBICs = municipalities.reduce((acc, m) => acc + m.totalBICs, 0);
    const declaredCount = municipalities.reduce((acc, m) => acc + m.declaredCount, 0);
    const notDeclaredCount = municipalities.reduce((acc, m) => acc + m.notDeclaredCount, 0);
    const nacionalCount = municipalities.reduce((acc, m) => acc + (m.nacionalCount || 0), 0);
    const departamentalCount = municipalities.reduce((acc, m) => acc + (m.departamentalCount || 0), 0);
    const municipalCount = municipalities.reduce((acc, m) => acc + (m.municipalCount || 0), 0);

    const bics = municipalities.flatMap(m => m.bics);

    const fullMark = totalBICs;
    return {
      totalBICs,
      declaredCount,
      notDeclaredCount,
      nacionalCount,
      departamentalCount,
      municipalCount,
      declaredPercentage: Math.round((declaredCount / totalBICs) * 100),
      radarData: [
        { subject: 'Nacional', value: nacionalCount, fullMark },
        { subject: 'Departamental', value: departamentalCount, fullMark },
        { subject: 'Municipal', value: municipalCount, fullMark },
      ],
      bics
    };
  }, [municipalities]);

  const provinceData = useMemo(() => {
    if (!dashboardProvince || municipalities.length === 0) return null;
    const provMunicipalities = municipalities.filter(m => m.province === dashboardProvince);
    if (provMunicipalities.length === 0) return null;

    const totalBICs = provMunicipalities.reduce((acc, m) => acc + m.totalBICs, 0);
    const declaredCount = provMunicipalities.reduce((acc, m) => acc + m.declaredCount, 0);
    const notDeclaredCount = provMunicipalities.reduce((acc, m) => acc + m.notDeclaredCount, 0);
    const nacionalCount = provMunicipalities.reduce((acc, m) => acc + (m.nacionalCount || 0), 0);
    const departamentalCount = provMunicipalities.reduce((acc, m) => acc + (m.departamentalCount || 0), 0);
    const municipalCount = provMunicipalities.reduce((acc, m) => acc + (m.municipalCount || 0), 0);

    const bics = provMunicipalities.flatMap(m => m.bics);

    const fullMark = totalBICs;
    return {
      name: dashboardProvince,
      municipalityCount: provMunicipalities.length,
      totalBICs,
      declaredCount,
      notDeclaredCount,
      nacionalCount,
      departamentalCount,
      municipalCount,
      declaredPercentage: Math.round((declaredCount / totalBICs) * 100),
      radarData: [
        { subject: 'Nacional', value: nacionalCount, fullMark },
        { subject: 'Departamental', value: departamentalCount, fullMark },
        { subject: 'Municipal', value: municipalCount, fullMark },
      ],
      bics
    };
  }, [municipalities, dashboardProvince]);

  const activeRadarData = isGlobal ? globalData?.radarData : isProvincial ? provinceData?.radarData : selectedMunicipality?.radarData;

  const activeSource = isGlobal ? globalData : isProvincial ? provinceData : selectedMunicipality;

  const activeStats = useMemo(() => {
    if (!activeSource) return { total: 0, nacional: 0, inmuebles: 0, muebles: 0, conPemp: 0 };
    const bics = activeSource.bics || [];
    const total = bics.length;
    const nacional = bics.filter((b: any) => b.nivel?.toLowerCase() === 'nacional').length;
    const inmuebles = bics.filter((b: any) => b.tipoBic?.toLowerCase().startsWith('inmueble')).length;
    const muebles = bics.filter((b: any) => b.tipoBic?.toLowerCase().startsWith('mueble')).length;
    const conPemp = bics.filter((b: any) => b.pemp && b.pemp.trim().length > 0 && b.pemp.toLowerCase().trim() !== 'no' && b.pemp.toLowerCase().trim() !== 'sin pemp' && !b.pemp.toLowerCase().includes('no requiere')).length;
    
    return {
      total,
      nacional,
      inmuebles,
      muebles,
      conPemp
    };
  }, [activeSource]);

  const sortedItems = useMemo(() => {
    const source = isGlobal ? globalData : isProvincial ? provinceData : selectedMunicipality;
    if (!source) return [];
    
    const items = [...source.bics];

    return items.sort((a: any, b: any) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [selectedMunicipality, globalData, provinceData, isGlobal, isProvincial, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const statsLeaders = useMemo(() => {
    if (municipalities.length === 0) return null;
    
    const sortedMuns = [...municipalities].sort((a, b) => b.totalBICs - a.totalBICs);
    const topMun = sortedMuns[0];
    
    const proms = Array.from(new Set(municipalities.map(m => m.province))).map(prov => {
      const provMuns = municipalities.filter(m => m.province === prov);
      return { 
        name: prov, 
        count: provMuns.reduce((acc, m) => acc + m.totalBICs, 0) 
      };
    }).sort((a, b) => b.count - a.count);
    const topProv = proms[0];

    const munsWithBIC = municipalities.filter(m => m.totalBICs > 0).length;

    return {
      topMunName: topMun.name,
      topMunValue: topMun.totalBICs,
      topProvName: topProv.name,
      topProvValue: topProv.count,
      munsWithBIC
    };
  }, [municipalities]);

  const dbStats = useMemo(() => {
    if (municipalities.length === 0) return null;
    const allBics = municipalities.flatMap(m => m.bics);
    const total = allBics.length;

    const tipoMap: Record<string, number> = {};
    const grupoMap: Record<string, number> = {};
    let hasPemp = 0;
    let noPemp = 0;

    allBics.forEach(bic => {
      const tipo = bic.tipoBic ? bic.tipoBic.trim() : 'No Especificado';
      tipoMap[tipo] = (tipoMap[tipo] || 0) + 1;

      const grupo = bic.grupo ? bic.grupo.trim() : 'No Especificado';
      grupoMap[grupo] = (grupoMap[grupo] || 0) + 1;

      if (bic.pemp && bic.pemp.trim().length > 0 && bic.pemp.toLowerCase().trim() !== 'no' && bic.pemp.toLowerCase().trim() !== 'sin pemp') {
        hasPemp++;
      } else {
        noPemp++;
      }
    });

    const tipoData = Object.entries(tipoMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const grupoData = Object.entries(grupoMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return {
      tipoData,
      grupoData,
      pempData: [
        { name: 'Con PEMP', value: hasPemp },
        { name: 'Sin PEMP / No Aplica', value: noPemp }
      ],
      total
    };
  }, [municipalities]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f9f4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-emerald-600 animate-spin" size={48} />
          <p className="text-emerald-900 font-bold animate-pulse">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!selectedMunicipality) return null;

  return (
    <div className="min-h-screen bg-[#f0f9f4] text-slate-800 font-sans p-4 md:p-8">
      {/* Main Container with Glassmorphism Effect */}
      <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-xl rounded-2xl md:rounded-[40px] shadow-2xl border border-white/40 overflow-hidden flex flex-col min-h-[850px]">
        
        {/* Top Header Navigation */}
        <header className="bg-emerald-900/5 border-b border-emerald-900/10 flex items-center justify-between flex-wrap gap-2 px-4 md:px-6 lg:px-10 py-3">
          
          {/* Nav Buttons */}
          <nav className="flex items-center bg-white/60 p-1 rounded-2xl border border-emerald-900/10 shadow-sm" aria-label="Navegación principal">
            {[ 
              { tab: 'dashboard', label: 'BIC' },
              { tab: 'stats',     label: 'Estadísticas' },
            ].map(({ tab, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                aria-current={activeTab === tab ? 'page' : undefined}
                className={cn(
                  "flex items-center px-4 py-2 md:px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                  activeTab === tab
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-emerald-800/50 hover:text-emerald-800 hover:bg-emerald-50"
                )}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Logo */}
          <div className="flex items-center gap-4">
            <img src="/img/Obser.png" alt="Observatorio de Cultura" className="h-8 md:h-12 w-auto object-contain" referrerPolicy="no-referrer" />
            <img src="/log2.png" alt="Logo Boyacá" className="h-8 md:h-12 w-auto object-contain" referrerPolicy="no-referrer" />
          </div>

        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col p-6 lg:p-10 gap-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-emerald-800/40 font-bold text-xs uppercase tracking-[0.2em]">
                        {isGlobal ? 'Dashboard departamental' : isProvincial ? 'Dashboard Provincial' : 'Dashboard Municipal'}
                      </h2>
                    </div>
                    <h1 className="text-2xl font-black text-emerald-950">Registro de Bienes de Interés Cultural (BIC)</h1>
                  </div>
                  
                  <div className="flex items-center bg-emerald-900/5 p-1 rounded-2xl border border-emerald-900/10 self-start md:self-center">
                    {(['municipal', 'provincial', 'departamental'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setViewLevel(level)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                          viewLevel === level
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-emerald-800/40 hover:text-emerald-800"
                        )}
                      >
                        {level === 'municipal' ? 'Municipal' : level === 'provincial' ? 'Provincial' : 'Departamental'}
                      </button>
                    ))}
                  </div>
                </div>

                <MapComponent
                  municipalities={baseData}
                  selectedMunicipality={selectedMunicipality}
                  onSelectMunicipality={(m) => {
                    setSelectedMunicipality(m);
                    setDashboardProvince(m.province);
                  }}
                  viewLevel={viewLevel}
                  dashboardProvince={dashboardProvince}
                />

          {/* Top Section: Flag, Radar, and Quick Stats */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
                  {/* Municipality Flag & Name */}
                  <div className="lg:col-span-4 flex flex-col items-center lg:items-start gap-6">
                    <motion.div 
                      key={isGlobal ? 'global' : isProvincial ? `province-${dashboardProvince}` : selectedMunicipality.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative group"
                    >
                      <div className="absolute -inset-4 bg-emerald-500/10 rounded-[32px] blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
                      <img 
                        src={isGlobal ? "/img/Departamento.png" : isProvincial ? `/img/Provin/${dashboardProvince}.png` : selectedMunicipality.flagUrl} 
                        alt={isGlobal ? "Boyacá" : isProvincial ? dashboardProvince : selectedMunicipality.name}
                        className="w-64 h-40 object-cover rounded-3xl shadow-2xl relative z-10 border-4 border-white"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = isGlobal || isProvincial ? "/img/Departamento.png" : `https://picsum.photos/seed/${selectedMunicipality.name}/300/200`;
                        }}
                      />
                    </motion.div>
                    <div className="text-center lg:text-left z-10">
                      <h1 className="text-5xl font-extrabold text-emerald-950 tracking-tight mb-1">
                        {isGlobal ? "Boyacá" : isProvincial ? dashboardProvince : selectedMunicipality.name}
                      </h1>
                      <div className="text-emerald-800/80 font-bold text-sm uppercase tracking-widest mb-2 px-1">
                        {isGlobal ? "Territorio Colombiano" : isProvincial ? `${provinceData?.municipalityCount ?? 0} Municipios` : `Provincia de ${selectedMunicipality.province}`}
                      </div>
                    </div>
                  </div>

                  {/* Pie Chart Section */}
                  <div className="lg:col-span-4 flex items-center justify-center relative min-h-[300px]">
                      <div className="absolute -inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-5xl font-black text-emerald-950 select-none">
                            {isGlobal ? globalData?.totalBICs : isProvincial ? provinceData?.totalBICs : selectedMunicipality.totalBICs}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-800/40">
                            Total Bienes
                          </div>
                        </div>
                      </div>
                    <div className="w-full h-full max-w-[350px]">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={activeRadarData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="subject"
                            startAngle={90}
                            endAngle={450}
                          >
                            {activeRadarData?.map((entry: any, index: number) => {
                              const colors: Record<string, string> = {
                                'Nacional': '#059669',
                                'Departamental': '#3b82f6',
                                'Municipal': '#f59e0b'
                              };
                              const fill = colors[entry.subject] || '#059669';
                              return (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={fill} 
                                  stroke="none"
                                />
                              );
                            })}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '16px', 
                              border: 'none', 
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            align="center"
                            iconType="circle"
                            formatter={(value) => (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800/60 ml-1">
                                {value}
                              </span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                    <StatCard 
                      label="Total BIC" 
                      value={activeStats.total} 
                      icon={<Landmark className="text-emerald-600" size={20} />}
                    />
                    <StatCard 
                      label="Tipo Mueble" 
                      value={activeStats.muebles} 
                      icon={<Package className="text-blue-600" size={20} />}
                    />
                    <StatCard 
                      label="Bienes con PEMP" 
                      value={activeStats.conPemp} 
                      icon={<ShieldCheck className="text-amber-600" size={20} />}
                    />
                    <StatCard 
                      label="Tipo Inmueble" 
                      value={activeStats.inmuebles} 
                      icon={<Building2 className="text-rose-500" size={20} />}
                    />
                  </div>
                </section>

                {/* Bottom Section: BIC Table & Municipality Selector */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
          
          {/* BIC List */}
          <div className="lg:col-span-8 bg-emerald-900/5 rounded-[32px] p-6 lg:p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-emerald-950">
                  Listado de Bienes de Interés Cultural
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-emerald-800/40 font-bold border-b border-emerald-900/10">
                      <th 
                        className="pb-4 pl-2 cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Nombre del BIC
                          {sortConfig.key === 'name' && (
                            sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          )}
                        </div>
                      </th>
                      {viewLevel !== 'municipal' && (
                        <th 
                          className="pb-4 cursor-pointer hover:text-emerald-600 transition-colors"
                          onClick={() => handleSort('municipalityName')}
                        >
                          <div className="flex items-center gap-1">
                            Municipio
                            {sortConfig.key === 'municipalityName' && (
                              sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                            )}
                          </div>
                        </th>
                      )}
                      <th 
                        className="pb-4 cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => handleSort('resolution')}
                      >
                        <div className="flex items-center gap-1">
                          Acuerdo / Resolución
                          {sortConfig.key === 'resolution' && (
                            sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          )}
                        </div>
                      </th>
                      <th 
                        className="pb-4 cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => handleSort('tipoBic')}
                      >
                        <div className="flex items-center gap-1">
                          Tipo
                          {sortConfig.key === 'tipoBic' && (
                            sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          )}
                        </div>
                      </th>
                      <th 
                        className="pb-4 cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => handleSort('categoria')}
                      >
                        <div className="flex items-center gap-1">
                          Categoría
                          {sortConfig.key === 'categoria' && (
                            sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          )}
                        </div>
                      </th>
                      <th 
                        className="pb-4 cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => handleSort('nivel')}
                      >
                        <div className="flex items-center gap-1">
                          Ámbito
                          {sortConfig.key === 'nivel' && (
                            sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/5">
                    <AnimatePresence mode="wait">
                      {sortedItems.map((item) => (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="group hover:bg-white/40 transition-colors cursor-pointer"
                          onClick={() => setSelectedBicForDetail(item)}
                        >
                          <td className="py-4 pl-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 overflow-hidden shrink-0">
                                <BICImage name={item.name} />
                              </div>
                              <span className="font-semibold text-emerald-950 group-hover:text-emerald-700 transition-colors line-clamp-2">{toTitleCase(item.name)}</span>
                            </div>
                          </td>
                          {viewLevel !== 'municipal' && (
                            <td className="py-4 font-medium text-emerald-800/80 text-sm whitespace-nowrap">{item.municipalityName}</td>
                          )}
                          <td className="py-4 font-medium text-emerald-800/80 text-sm max-w-[160px] truncate" title={item.resolution}>{item.resolution}</td>
                          <td className="py-4">
                            {item.tipoBic && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 whitespace-nowrap">
                                {item.tipoBic}
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-emerald-800/80 text-xs font-medium max-w-[140px] truncate" title={item.categoria}>
                            {item.categoria || '---'}
                          </td>
                          <td className="py-4">
                            {item.nivel && (
                              <div className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap",
                                item.nivel.toLowerCase() === 'nacional'
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : item.nivel.toLowerCase() === 'departamental'
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "bg-amber-100 text-amber-700 border-amber-200"
                              )}>
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  item.nivel.toLowerCase() === 'nacional'
                                    ? "bg-emerald-500"
                                    : item.nivel.toLowerCase() === 'departamental'
                                      ? "bg-blue-500"
                                      : "bg-amber-500"
                                )} />
                                <span>{item.nivel}</span>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
                {sortedItems.length === 0 && (
                  <p className="text-sm text-emerald-800/40 mt-8 text-center italic">
                    No hay datos registrados.
                  </p>
                )}
              </div>
            </div>

            {/* Municipality / Province Selector Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {viewLevel === 'municipal' && (
                <>
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-emerald-900">Municipios</h3>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="w-2 h-2 rounded-full bg-emerald-200" />
                    </div>
                  </div>

                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-800/30" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar..." 
                      className="w-full bg-emerald-900/5 border-none rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-sm text-emerald-900 placeholder:text-emerald-800/30"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredMunicipalities.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMunicipality(m)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group",
                          selectedMunicipality.id === m.id 
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 translate-x-2" 
                            : "bg-white hover:bg-emerald-50 text-emerald-950 border border-emerald-900/5"
                        )}
                      >
                        <img 
                          src={m.flagUrl} 
                          className="w-12 h-8 object-cover rounded-md shadow-sm border border-white/20" 
                          alt={m.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://picsum.photos/seed/${m.name}/100/100`;
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-bold text-sm">{m.name}</div>
                          <div className={cn(
                            "text-[10px] font-medium opacity-60",
                            selectedMunicipality.id === m.id ? "text-emerald-50" : "text-emerald-800"
                          )}>
                            {m.totalBICs} Bienes · {m.totalBICs > 0 ? Math.round((m.declaredCount / m.totalBICs) * 100) : 0}% Decl.
                          </div>
                        </div>
                        {selectedMunicipality.id === m.id && (
                          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                            <ChevronDown size={14} className="-rotate-90" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {viewLevel === 'provincial' && (
                <>
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-emerald-900">Provincias</h3>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="w-2 h-2 rounded-full bg-emerald-200" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {Array.from(new Set(municipalities.map(m => m.province))).sort().map((province) => {
                      const provMuns = municipalities.filter(m => m.province === province);
                      const totalBicsCount = provMuns.reduce((acc, m) => acc + m.totalBICs, 0);
                      const isSelected = dashboardProvince === province;
                      return (
                        <button
                          key={province}
                          onClick={() => {
                          setDashboardProvince(province);
                          if (viewLevel !== 'provincial') setViewLevel('provincial');
                        }}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group",
                            isSelected
                              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 translate-x-2"
                              : "bg-white hover:bg-emerald-50 text-emerald-950 border border-emerald-900/5"
                          )}
                        >
                          <img
                            src={`/img/Provin/${province}.png`}
                            alt={province}
                            className="w-12 h-8 object-cover rounded-md shadow-sm border border-white/20 shrink-0"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/img/Departamento.png";
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-bold text-sm">{province}</div>
                        <div className={cn(
                          "text-[10px] font-medium opacity-60",
                          isSelected ? "text-emerald-50" : "text-emerald-800"
                        )}>
                          {provMuns.length} Municipios · {totalBicsCount} Bienes
                        </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                              <ChevronDown size={14} className="-rotate-90" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}


            </div>
          </section>
      </motion.div>
      ) : (
        <motion.div
          key="stats"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col gap-8"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-emerald-800/40 font-bold text-xs uppercase tracking-[0.2em]">Análisis de Datos</h2>
            <h1 className="text-2xl font-black text-emerald-950">Estadísticas de Patrimonio BIC</h1>
          </div>

          {/* New KPI Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="Líder Municipal" 
              value={statsLeaders?.topMunName || '---'} 
              variant="primary"
            />
            <StatCard 
              label="Provincia Líder" 
              value={statsLeaders?.topProvName || '---'} 
            />
             <StatCard 
              label="Cobertura BIC" 
              value={`${statsLeaders?.munsWithBIC || 0} Municipios`} 
            />
            <StatCard 
              label="Total Departamental" 
              value={globalData?.totalBICs || 0} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Municipalities Chart */}
            <div className="bg-white p-8 rounded-[40px] border border-emerald-900/5 shadow-sm">
              <h3 className="font-black text-emerald-950 mb-6 flex items-center gap-2">
                Top 10 Municipios por Cantidad de BIC
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  layout="vertical"
                  data={[...municipalities].sort((a, b) => b.totalBICs - a.totalBICs).slice(0, 10)}
                  margin={{ left: 20, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" horizontal={false} />
                  <XAxis type="number" fontSize={11} fontWeight={700} fill="#065f46" />
                  <YAxis type="category" dataKey="name" fontSize={10} width={100} fontWeight={600} fill="#065f46" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'rgba(5, 150, 105, 0.05)' }}
                  />
                  <Bar dataKey="totalBICs" name="Total Bienes" fill="#059669" radius={[0, 8, 8, 0]}>
                    <LabelList dataKey="totalBICs" position="right" style={{ fill: '#065f46', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Provinces Summary Chart */}
            <div className="bg-white p-8 rounded-[40px] border border-emerald-900/5 shadow-sm">
              <h3 className="font-black text-emerald-950 mb-6 flex items-center gap-2">
                Nivel de Declaración por Provincia
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={Array.from(new Set(municipalities.map(m => m.province))).map(prov => {
                    const provMuns = municipalities.filter(m => m.province === prov);
                    const nacional = provMuns.reduce((acc, m) => acc + (m.nacionalCount || 0), 0);
                    const departamental = provMuns.reduce((acc, m) => acc + (m.departamentalCount || 0), 0);
                    const municipal = provMuns.reduce((acc, m) => acc + (m.municipalCount || 0), 0);
                    const total = nacional + departamental + municipal;
                    return {
                      province: prov,
                      Nacional: nacional,
                      Departamental: departamental,
                      Municipal: municipal,
                      total
                    };
                  }).sort((a, b) => b.total - a.total)}
                  margin={{ bottom: 80, top: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" vertical={false} />
                  <XAxis 
                    dataKey="province" 
                    fontSize={10} 
                    fontWeight={700} 
                    fill="#065f46" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0}
                    height={100}
                    dy={10}
                  />
                  <YAxis fontSize={11} fontWeight={700} fill="#065f46" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" iconType="circle" />
                  <Bar dataKey="Nacional" name="Nacional" stackId="a" fill="#059669" />
                  <Bar dataKey="Departamental" name="Departamental" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Municipal" name="Municipal" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tipo de BIC Donut Chart */}
            <div className="bg-white p-8 rounded-[40px] border border-emerald-900/5 shadow-sm">
              <h3 className="font-black text-emerald-950 mb-2 flex items-center gap-2">
                Clasificación por Tipo de BIC
              </h3>
              <p className="text-emerald-800/60 font-medium text-xs mb-6">
                Proporción de bienes culturales inmuebles, muebles o manifestaciones inmateriales.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dbStats?.tipoData || []}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {(dbStats?.tipoData || []).map((entry, index) => {
                          const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
                          return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                        })}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2">
                  {(dbStats?.tipoData || []).slice(0, 5).map((item, index) => {
                    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
                    const pct = dbStats?.total ? Math.round((item.value / dbStats.total) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs font-semibold p-2 rounded-xl bg-emerald-900/5 border border-emerald-900/5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-emerald-950 truncate max-w-[120px]" title={item.name}>{item.name}</span>
                        </div>
                        <span className="text-emerald-800/80">{item.value} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grupo de Patrimonio Horizontal Bar Chart */}
            <div className="bg-white p-8 rounded-[40px] border border-emerald-900/5 shadow-sm">
              <h3 className="font-black text-emerald-950 mb-2 flex items-center gap-2">
                Distribución por Grupo de Patrimonio
              </h3>
              <p className="text-emerald-800/60 font-medium text-xs mb-6">
                Principales grupos de clasificación para los bienes de interés cultural del departamento.
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  layout="vertical"
                  data={dbStats?.grupoData?.slice(0, 8) || []}
                  margin={{ left: 10, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" horizontal={false} />
                  <XAxis type="number" fontSize={11} fontWeight={700} fill="#065f46" />
                  <YAxis type="category" dataKey="name" fontSize={10} width={90} fontWeight={600} fill="#065f46" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'rgba(5, 150, 105, 0.05)' }}
                  />
                  <Bar dataKey="value" name="Bienes" fill="#3b82f6" radius={[0, 8, 8, 0]}>
                    <LabelList dataKey="value" position="right" style={{ fill: '#1e3a8a', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>


          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </main>

  {/* Modal de Detalle de BIC */}
  <AnimatePresence>
    {selectedBicForDetail && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[32px] shadow-2xl border border-emerald-900/5 max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col relative"
        >
          {/* Header */}
          <div className="bg-emerald-900 text-white p-6 relative flex items-start justify-between">
            <div className="flex flex-col gap-1 pr-6">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold border",
                  selectedBicForDetail.nivel?.toLowerCase() === 'nacional'
                    ? "bg-emerald-800 text-emerald-100 border-emerald-700"
                    : selectedBicForDetail.nivel?.toLowerCase() === 'departamental'
                      ? "bg-blue-800 text-blue-100 border-blue-700"
                      : "bg-amber-800 text-amber-100 border-amber-700"
                )}>
                  BIC {selectedBicForDetail.nivel}
                </span>
                {selectedBicForDetail.tipoBic && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/10">
                    {selectedBicForDetail.tipoBic}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold mt-1 text-white leading-tight">
                {toTitleCase(selectedBicForDetail.name)}
              </h2>
            </div>
            <button
              onClick={() => setSelectedBicForDetail(null)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 outline-none"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar text-emerald-950">
            {/* Municipio y Provincia */}
            <div className="grid grid-cols-2 gap-4 bg-emerald-900/5 p-4 rounded-2xl border border-emerald-900/10">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/40">Municipio</div>
                <div className="font-bold text-sm text-emerald-950">{selectedBicForDetail.municipalityName}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/40">Provincia</div>
                <div className="font-bold text-sm text-emerald-950">
                  {baseData.find(m => m.name === selectedBicForDetail.municipalityName)?.province || 'Boyacá'}
                </div>
              </div>
            </div>

            {/* Clasificación */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-sm text-emerald-900 border-b border-emerald-900/10 pb-1">Clasificación Patrimonial</h3>
              
              {selectedBicForDetail.grupo && (
                <div className="flex items-start gap-3">
                  <Tag className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/40">Grupo</div>
                    <div className="text-sm font-medium">{selectedBicForDetail.grupo}</div>
                  </div>
                </div>
              )}

              {selectedBicForDetail.subgrupo && (
                <div className="flex items-start gap-3">
                  <Tag className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/40">Subgrupo</div>
                    <div className="text-sm font-medium">{selectedBicForDetail.subgrupo}</div>
                  </div>
                </div>
              )}

              {selectedBicForDetail.categoria && (
                <div className="flex items-start gap-3">
                  <Tag className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/40">Categoría</div>
                    <div className="text-sm font-medium">{selectedBicForDetail.categoria}</div>
                  </div>
                </div>
              )}

              {selectedBicForDetail.subcategoria && (
                <div className="flex items-start gap-3">
                  <Tag className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/40">Subcategoría</div>
                    <div className="text-sm font-medium">{selectedBicForDetail.subcategoria}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Detalles Geográficos y Legales */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-sm text-emerald-900 border-b border-emerald-900/10 pb-1">Ubicación y Estado Legal</h3>

              {selectedBicForDetail.direccion && (
                <div className="flex items-start gap-3">
                  <MapPin className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/40">Dirección o Localización</div>
                    <div className="text-sm font-medium">{selectedBicForDetail.direccion}</div>
                  </div>
                </div>
              )}

              {selectedBicForDetail.resolution && (
                <div className="flex items-start gap-3">
                  <FileText className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/40">Acto Administrativo / Declaratoria</div>
                    <div className="text-sm font-medium">{selectedBicForDetail.resolution}</div>
                  </div>
                </div>
              )}

              {selectedBicForDetail.zonaInfluencia && (
                <div className="flex items-start gap-3">
                  <Map className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/40">Zona de Influencia</div>
                    <div className="text-sm font-medium leading-relaxed">{selectedBicForDetail.zonaInfluencia}</div>
                  </div>
                </div>
              )}

              {selectedBicForDetail.pemp && (
                <div className="flex items-start gap-3">
                  <Shield className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/40">PEMP (Plan de Manejo y Protección)</div>
                    <div className="text-sm font-medium leading-relaxed">{selectedBicForDetail.pemp}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-emerald-900/5 border-t border-emerald-900/10 flex justify-end shrink-0">
            <button
              onClick={() => setSelectedBicForDetail(null)}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
</div>
</div>
);
}

function StatCard({ label, value, icon, variant = 'default' }: { label: string, value: string | number, icon?: React.ReactNode, variant?: 'default' | 'primary' }) {
  return (
    <div className={cn(
      "p-5 rounded-3xl border transition-all duration-300 group",
      variant === 'primary' 
        ? "bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-600/10" 
        : "bg-white border-emerald-900/5 hover:border-emerald-200"
    )}>
      {icon && (
        <div className="flex items-center justify-between mb-3">
          <div className={cn(
            "p-2 rounded-xl",
            variant === 'primary' ? "bg-white/20" : "bg-emerald-50"
          )}>
            {icon}
          </div>
        </div>
      )}
      <div className={cn(
        "text-2xl font-black mb-1",
        variant === 'primary' ? "text-white" : "text-emerald-950"
      )}>
        {value}
      </div>
      <div className={cn(
        "text-[10px] font-bold uppercase tracking-wider",
        variant === 'primary' ? "text-emerald-100/60" : "text-emerald-800/40"
      )}>
        {label}
      </div>
    </div>
  );
}

const FAMILY_COLORS = ['#34d399', '#10b981', '#059669', '#047857', '#6ee7b7', '#0d9488', '#0f766e'];
const MAX_CHART_FAMILIES = 7;

function FlipStatCard({ label, value, icon, groupData }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  groupData: { name: string; quantity: number }[];
}) {
  const [flipped, setFlipped] = useState(false);

  const chartData = groupData
    .filter(g => g.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, MAX_CHART_FAMILIES)
    .map((g, i) => ({
      name: toTitleCase(g.name),
      value: g.quantity,
      fill: FAMILY_COLORS[i % FAMILY_COLORS.length],
    }));

  return (
    <div
      style={{ perspective: '1000px' }}
      className="cursor-pointer"
      onClick={() => setFlipped(f => !f)}
    >
      <div
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          position: 'relative',
        }}
      >
        {/* Front face */}
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className="p-5 rounded-3xl border bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-600/10"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-white/20">
              {icon}
            </div>
          </div>
          <div className="text-2xl font-black mb-1 text-white">{value}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/60">{label}</div>
        </div>

        {/* Back face */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: 'absolute',
            inset: 0,
          }}
          className="p-4 rounded-3xl border bg-emerald-800 border-emerald-700 shadow-lg shadow-emerald-600/10 flex flex-col overflow-hidden"
        >
          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300/70 mb-1 shrink-0">
            Por familia
          </p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="15%"
                outerRadius="90%"
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  dataKey="value"
                  background={{ fill: 'rgba(255,255,255,0.05)' }}
                  cornerRadius={2}
                />
                <Tooltip
                  formatter={(val: number, _key: string, item: { payload?: { name?: string } }) => [val, item.payload?.name ?? '']}
                  contentStyle={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    backgroundColor: '#064e3b',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#a7f3d0',
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
