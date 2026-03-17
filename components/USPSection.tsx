
import React from 'react';
import { USPData } from '../types';
import { CheckCircle2, TrendingUp, AlertOctagon, Lightbulb, Users, Target, ArrowUpRight, XCircle, ShieldCheck } from 'lucide-react';

interface Props {
  data: USPData;
}

const USPSection: React.FC<Props> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* 1. SECTION: CLIENT ANALYSIS (Split View) */}
      <div className="bg-[#141313] border border-[#333] rounded-xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-[#333] bg-gradient-to-r from-[#63c1cf]/10 to-transparent">
          <h2 className="text-xl font-bold text-[#f7f7f7] flex items-center gap-3">
            <Target className="w-6 h-6 text-[#63c1cf]" />
            Analýza Vášho Biznisu (Objektívny Pohľad)
          </h2>
          <p className="text-sm text-[#c5c5c5] mt-1">
            Porovnanie vašich silných stránok voči identifikovaným medzerám v porovnaní s trhom.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#333]">
          {/* Client Strengths */}
          <div className="bg-[#141313] p-6">
            <div className="flex items-center gap-2 mb-4 text-[#63c1cf]">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-semibold uppercase tracking-wider text-xs">Vaše Silné Stránky (USP)</h3>
            </div>
            <ul className="space-y-3">
              {(data.clientStrengths || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-[#f7f7f7]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#63c1cf] mt-2 shrink-0" />
                  <span className="font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Client Opportunities */}
          <div className="bg-[#141313] p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <ArrowUpRight className="w-20 h-20 text-[#f27069]" />
             </div>
            <div className="flex items-center gap-2 mb-4 text-[#f27069]">
              <ArrowUpRight className="w-5 h-5" />
              <h3 className="font-semibold uppercase tracking-wider text-xs">Priestor na Zlepšenie (Opportunities)</h3>
            </div>
            <ul className="space-y-3 relative z-10">
              {(data.clientOpportunities || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-[#c5c5c5]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f27069] mt-2 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 2. SECTION: COMPETITOR DEEP DIVE */}
      <div className="bg-[#141313] border border-[#333] rounded-xl overflow-hidden shadow-lg">
         <div className="p-6 border-b border-[#333] bg-[#1a1a1a]">
          <h2 className="text-xl font-bold text-[#f7f7f7] flex items-center gap-3">
            <Users className="w-6 h-6 text-[#a0a0a0]" />
            Detailná Analýza Konkurencie
          </h2>
          <p className="text-sm text-[#c5c5c5] mt-1">
            Konkrétne dôvody, prečo konkurencia vyhráva a kde naopak zlyháva.
          </p>
        </div>
        
        <div className="divide-y divide-[#333]">
          {(data.competitorDeepDive || []).map((comp, idx) => (
            <div key={idx} className="p-6 hover:bg-[#1a1a1a] transition-colors">
              <h3 className="text-lg font-bold text-[#f7f7f7] mb-4 flex items-center gap-2">
                <span className="text-[#63c1cf] opacity-50">#{idx + 1}</span>
                {comp.name}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Their USPs */}
                <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
                  <div className="flex items-center gap-2 mb-3 text-[#a0a0a0]">
                    <CheckCircle2 className="w-4 h-4 text-[#a0a0a0]" />
                    <span className="text-xs font-bold uppercase tracking-wider">V čom sú silní</span>
                  </div>
                  <ul className="space-y-2">
                    {(comp.theirUSPs || []).map((usp, i) => (
                      <li key={i} className="text-sm text-[#c5c5c5] flex items-start gap-2">
                        <span className="text-[#a0a0a0]">•</span>
                        {usp}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Their Shortcomings */}
                <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
                  <div className="flex items-center gap-2 mb-3 text-[#f27069]">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Kde zlyhávajú</span>
                  </div>
                  <ul className="space-y-2">
                    {(comp.theirShortcomings || []).map((gap, i) => (
                       <li key={i} className="text-sm text-[#c5c5c5] flex items-start gap-2">
                        <span className="text-[#f27069]">•</span>
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SECTION: MARKET BASELINE & RECOMMENDATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Market Standards */}
        <div className="bg-[#141313] border border-[#333] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4 text-[#888]">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-semibold uppercase tracking-wider text-xs">Trhový Štandard (Baseline)</h3>
          </div>
          <ul className="space-y-3">
            {(data.marketStandards || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-[#888]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#333] mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actionable Recommendations */}
        <div className="bg-[#141313] border border-[#333] rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-5">
             <Lightbulb className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2 mb-4 text-[#fbbf24]">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-semibold uppercase tracking-wider text-xs">Strategické Odporúčania</h3>
          </div>
          <ul className="space-y-3 relative z-10">
            {(data.recommendations || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-[#f7f7f7]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] mt-2 shrink-0" />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default USPSection;
