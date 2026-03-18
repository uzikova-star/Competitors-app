
import React from 'react';
import { ClientAnalysis } from '../types';
import { Target, Briefcase, MapPin, Package, ExternalLink, Globe, Star } from 'lucide-react';

interface Props {
  data: ClientAnalysis;
}

const ClientAnalysisCard: React.FC<Props> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-[#141313] border border-[#333] rounded-xl p-6 mb-8 shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#333] pb-4 mb-6 gap-4">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-[#a0a0a0] font-semibold mb-1">
            Analýza Klienta
          </h3>
          <h2 className="text-2xl font-bold text-[#f7f7f7] tracking-tight">{data.name || 'Neznámy Klient'}</h2>
        </div>

        {data.url && (
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#63c1cf]/10 hover:bg-[#63c1cf]/20 text-[#63c1cf] transition-colors text-sm font-medium"
          >
            <Globe className="w-4 h-4" />
            {data.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2 text-[#63c1cf]">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm font-semibold">Odvetvie</span>
          </div>
          <p className="text-[#f7f7f7] text-sm font-medium">{data.industry || 'Neuvedené'}</p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2 text-[#63c1cf]">
            <Target className="w-4 h-4" />
            <span className="text-sm font-semibold">Hlavné Služby</span>
          </div>
          <div className="flex flex-col gap-2">
            {(data.services || []).slice(0, 4).map((s, i) => (
              <div key={i} className="text-xs bg-[#63c1cf]/10 text-[#c5c5c5] px-3 py-2 rounded-lg border border-[#63c1cf]/20 leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2 text-[#63c1cf]">
            <Package className="w-4 h-4" />
            <span className="text-sm font-semibold">Kľúčové Produkty</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(data.products || []).slice(0, 5).map((s, i) => (
              <span key={i} className="text-xs bg-[#1f1f1f] text-[#c5c5c5] px-3 py-1.5 rounded-md border border-[#444]">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2 text-[#63c1cf]">
            <Star className="w-4 h-4 text-[#f27069]" />
            <span className="text-sm font-semibold">Top Produkty</span>
          </div>
          <div className="flex flex-col gap-2">
            {(data.topSellers || []).slice(0, 4).map((s, i) => (
              <div key={i} className="text-xs bg-[#f27069]/10 text-[#f7f7f7] px-3 py-2 rounded-lg border border-[#f27069]/20 leading-relaxed flex items-center gap-2">
                <span className="w-1 h-1 bg-[#f27069] rounded-full shrink-0" />
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2 text-[#63c1cf]">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-semibold">Cieľový Región</span>
          </div>
          <p className="text-[#f7f7f7] text-sm font-medium">{data.targetRegion || 'Neuvedené'}</p>
        </div>

      </div>
    </div>
  );
};

export default ClientAnalysisCard;
