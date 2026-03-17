
import React from 'react';
import { Competitor } from '../types';
import { ExternalLink, Search, DollarSign, Activity, Eye, CheckCircle, XCircle, Music2, Store, TrendingUp, User, ShoppingBag, Star } from 'lucide-react';

interface CompetitorTableProps {
  title: string;
  description: string;
  competitors: Competitor[];
  icon: React.ReactNode;
  countryCode?: string;
}

const CompetitorTable: React.FC<CompetitorTableProps> = ({ title, description, competitors, icon, countryCode }) => {
  const getMetaAdsLink = (name: string, domain?: string) => {
    const query = domain ? domain.replace('https://', '').replace('http://', '').split('/')[0] : name;
    return `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(query)}`;
  };

  const getTikTokAdsLink = (name: string, handle?: string) => {
    const region = countryCode || 'ALL';
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    const endTime = now.getTime();
    const startTime = threeMonthsAgo.getTime();

    // Use handle if verified, otherwise fallback to brand name
    const query = handle && handle !== 'Nenájdené' ? handle.replace('@', '') : name;

    return `https://library.tiktok.com/ads?region=${region}&type=all&start_time=${startTime}&end_time=${endTime}&q=${encodeURIComponent(query)}`;
  };

  return (
    <div className="bg-[#141313] border border-[#333] rounded-xl overflow-hidden shadow-lg mb-8">
      <div className={`p-6 border-b border-[#333] bg-[#63c1cf] bg-opacity-10`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-[#63c1cf] bg-opacity-20`}>
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f7f7f7]">{title}</h2>
            <p className="text-sm text-[#c5c5c5]">{description}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm text-[#c5c5c5]">
          <thead className="bg-[#0a0a0a] text-[#c5c5c5] font-medium border-b border-[#333]">
            <tr>
              <th className="px-6 py-4">Spoločnosť</th>
              <th className="px-6 py-4">Financie & Ad Spend</th>
              <th className="px-6 py-4 w-1/5">Produkty & Best Sellers</th>
              <th className="px-6 py-4">SEO Pozícia</th>
              <th className="px-6 py-4 w-1/4">Reklamná Stratégia</th>
              <th className="px-6 py-4 text-right">Ads Library</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333]">
            {(competitors || []).map((comp, idx) => (
              <tr key={idx} className="hover:bg-[#f7f7f7]/5 transition-colors">
                <td className="px-6 py-4 align-top">
                  <div className="font-semibold text-[#f7f7f7] text-base">{comp.name}</div>
                  {comp.website && (
                    <a href={comp.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#63c1cf] hover:text-[#82d2de] flex items-center gap-1 mt-1">
                      {new URL(comp.website).hostname}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-[#63c1cf] shrink-0" />
                        <span className="text-[#f7f7f7] font-medium">{comp.revenue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-[#63c1cf] shrink-0" />
                        <span className="text-[#c5c5c5] text-xs">{comp.economicResult}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#333]/50 space-y-2">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-3 h-3 text-[#f27069] mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[#f7f7f7] text-xs font-bold">{comp.monthlyAdSpend}</div>
                          <div className="text-[10px] text-[#888] uppercase tracking-wide">Mesačne (Odhad)</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Store className={`w-3 h-3 shrink-0 ${comp.physicalStore ? 'text-[#63c1cf]' : 'text-[#c5c5c5]'}`} />
                        <span className="text-[#c5c5c5] text-xs">
                          Kamenná predajňa: <span className={comp.physicalStore ? "text-[#f7f7f7] font-semibold" : ""}>{comp.physicalStore ? "Áno" : "Nie"}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="space-y-3">
                    {comp.mainProducts && comp.mainProducts.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider">
                          <ShoppingBag className="w-3 h-3" />
                          Hlavné Kategórie
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {comp.mainProducts.map((prod, i) => (
                            <span key={i} className="inline-block px-2 py-0.5 rounded text-[11px] bg-[#333]/50 text-[#c5c5c5] border border-[#444]">
                              {prod}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {comp.bestSellers && comp.bestSellers.length > 0 && (
                      <div className="pt-2 border-t border-[#333]/50">
                        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-[#f27069] uppercase tracking-wider">
                          <Star className="w-3 h-3 fill-current" />
                          Top Produkty
                        </div>
                        <ul className="space-y-1">
                          {comp.bestSellers.map((item, i) => (
                            <li key={i} className="text-xs text-[#f7f7f7] flex items-start gap-1.5 leading-snug">
                              <span className="text-[#f27069] mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3 text-[#63c1cf] shrink-0" />
                      <span className="font-medium text-[#f7f7f7]">{comp.seoPosition}</span>
                    </div>
                    <p className="text-xs text-[#c5c5c5] leading-relaxed line-clamp-3" title={comp.seoStrategy}>
                      {comp.seoStrategy}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-[#a0a0a0] w-12 shrink-0">Meta:</span>
                        {comp.metaAdsStatus ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#63c1cf] bg-[#63c1cf]/10 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Aktívne
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#c5c5c5] bg-[#c5c5c5]/10 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Neaktívne
                          </span>
                        )}
                      </div>
                      {comp.metaAdsStatus && comp.metaAdsFocus && (
                        <p className="text-xs text-[#c5c5c5] leading-relaxed">{comp.metaAdsFocus}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-[#a0a0a0] w-12 shrink-0">TikTok:</span>
                        {comp.tikTokAdsStatus ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#f27069] bg-[#f27069]/10 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Aktívne
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#c5c5c5] bg-[#c5c5c5]/10 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Neaktívne
                          </span>
                        )}
                      </div>
                      {comp.tikTokAdsStatus && comp.tikTokAdsFocus && (
                        <p className="text-xs text-[#c5c5c5] leading-relaxed">{comp.tikTokAdsFocus}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-[#333]/50">
                      <span className="text-xs text-[#a0a0a0] w-12 shrink-0">Google:</span>
                      {comp.googlePPC ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#63c1cf] bg-[#63c1cf]/10 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> PPC Áno
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#c5c5c5] bg-[#c5c5c5]/10 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> PPC Nie
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top text-right">
                  <div className="flex flex-col gap-2 items-end">
                    <a
                      href={getMetaAdsLink(comp.name, comp.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#63c1cf] hover:bg-[#4ab5c4] text-[#141313] text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm w-[130px]"
                    >
                      <Search className="w-3 h-3" />
                      Meta Ads
                    </a>

                    <div className="flex flex-col gap-1 w-[130px]">
                      <a
                        href={getTikTokAdsLink(comp.name, comp.tikTokAccountName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#f7f7f7] border border-[#333] text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm w-full"
                      >
                        <Music2 className="w-3 h-3" />
                        TikTok Ads
                      </a>

                      {comp.tikTokProfileUrl && comp.tikTokProfileUrl !== 'Nenájdené' ? (
                        <a
                          href={comp.tikTokProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-[#f27069]/10 hover:bg-[#f27069]/20 text-[#f27069] border border-[#f27069]/30 text-[10px] font-bold px-2 py-1 rounded-md transition-colors w-full"
                        >
                          <User className="w-3 h-3" />
                          {comp.tikTokAccountName}
                        </a>
                      ) : (
                        comp.tikTokAccountName && comp.tikTokAccountName !== 'Nenájdené' && (
                          <span className="text-[10px] text-[#888] text-center italic">
                            Handle: {comp.tikTokAccountName}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompetitorTable;
