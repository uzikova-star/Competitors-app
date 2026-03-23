
import React, { useState } from 'react';
import { analyzeCompetitors, verifyClient, } from './services/geminiService';
import InputSection from './components/InputSection';
import CompetitorTable from './components/CompetitorTable';
import ClientAnalysisCard from './components/ClientAnalysis';
import USPSection from './components/USPSection';
import { AnalysisResult, AppStatus } from './types';
import { Crown, Zap, AlertCircle, ArrowLeft, ExternalLink, ChevronDown, ChevronUp, Bot, Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';
verifyClient
const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus | 'verifying_client'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSourcesVisible, setIsSourcesVisible] = useState(false);

  // Verification State
  const [verificationData, setVerificationData] = useState<{ summary: string; correctIndustry: string; keyProducts: string[]; usp: string } | null>(null);
  const [pendingRequest, setPendingRequest] = useState<{ url: string; country: string; industry: string } | null>(null);

  const handleAnalyzeRequest = async (url: string, country: string, industry: string) => {
    setStatus('verifying_client');
    setErrorMsg('');
    setVerificationData(null);
    setPendingRequest({ url, country, industry });

    try {
      const data = await verifyClient(url, country, industry);
      setVerificationData(data);
    } catch (err: any) {
      console.error("Verification failed:", err);
      // If verification fails, just fallback to direct analysis
      startFullAnalysis(url, country, industry);
    }
  };

  const startFullAnalysis = async (url: string, country: string, industry: string, topProducts?: string) => {
    setStatus('analyzing');
    setIsSourcesVisible(false);
    try {
      const data = await analyzeCompetitors(url, country, industry, topProducts);
      setResult(data);
      setStatus('complete');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Pri analýze nastala chyba.');
      setStatus('error');
    }
  };

  const handleVerificationConfirm = () => {
    if (pendingRequest && verificationData) {
      const topProductsHint = verificationData.keyProducts?.join(', ');
      startFullAnalysis(pendingRequest.url, pendingRequest.country, verificationData.correctIndustry, topProductsHint);
    }
  };

  const handleVerificationEdit = (newIndustry: string) => {
    if (pendingRequest) {
      // If user updates industry, we use that for the full analysis
      startFullAnalysis(pendingRequest.url, pendingRequest.country, newIndustry);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-[#141313] p-2 rounded-lg">
            <Zap className="h-6 w-6 text-[#63c1cf]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#141313]">MarketSpy.ai</span>
        </div>

        <div className="flex items-center gap-4">

          {status === 'complete' && (
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg border border-[#141313]/50 hover:bg-[#141313] hover:text-[#f7f7f7] text-[#141313] flex items-center gap-2 transition-all text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Nové Hľadanie
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <InputSection onAnalyze={handleAnalyzeRequest} isLoading={false} />
          </div>
        )}

        {status === 'verifying_client' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            {!verificationData ? (
              <div className="text-center animate-pulse">
                <Loader2 className="w-12 h-12 text-[#63c1cf] mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-bold text-[#f7f7f7]">Analyzujem klienta...</h3>
                <p className="text-[#c5c5c5]">Overujem zadanú URL a odvetvie.</p>
              </div>
            ) : (
              <div className="max-w-md w-full bg-[#141313] border border-[#333] rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                <div className="flex items-center gap-3 mb-6 justify-center">
                  <CheckCircle className="w-8 h-8 text-[#63c1cf]" />
                  <h2 className="text-xl font-bold text-[#f7f7f7]">Overenie Zadania</h2>
                </div>

                <div className="bg-[#1f1f1f] p-5 rounded-xl mb-6 border border-[#333] space-y-5">
                  <div className="flex flex-col items-center text-center pb-3 border-b border-[#333]">
                    <p className="text-[#a0a0a0] text-[10px] uppercase tracking-[0.2em] mb-1">Webová stránka klienta</p>
                    <a
                      href={pendingRequest?.url.startsWith('http') ? pendingRequest.url : `https://${pendingRequest?.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#63c1cf] hover:text-[#4ab5c4] flex items-center gap-1.5 font-bold text-base transition-colors"
                    >
                      {pendingRequest?.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-[#a0a0a0] text-[10px] uppercase tracking-wider mb-0.5">Identifikované odvetvie</p>
                      <p className="text-[#f7f7f7] font-bold text-lg">{verificationData.correctIndustry}</p>
                    </div>

                    {verificationData.summary && verificationData.summary !== "" && (
                      <div className="text-center">
                        <p className="text-[#a0a0a0] text-[10px] uppercase tracking-wider mb-0.5">Zhrnutie podnikania</p>
                        <p className="text-[#c5c5c5] text-xs leading-relaxed font-medium px-2">"{verificationData.summary}"</p>
                      </div>
                    )}

                    <div>
                      <p className="text-[#a0a0a0] text-[10px] uppercase tracking-wider mb-1.5 text-center">Top Produkty a Služby</p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {verificationData.keyProducts && verificationData.keyProducts.length > 0 ? (
                          verificationData.keyProducts.map((prod, i) => (
                            <span key={i} className="px-2.5 py-0.5 bg-[#141313] border border-[#63c1cf]/30 rounded-full text-[10px] text-[#63c1cf] font-semibold">
                              {prod}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#666] text-[10px] italic">Nepodarilo sa automaticky získať zoznam produktov.</span>
                        )}
                      </div>
                    </div>

                    {verificationData.usp && verificationData.usp !== "" && verificationData.usp !== "N/A" && (
                      <div className="text-center pt-1">
                        <p className="text-[#a0a0a0] text-[10px] uppercase tracking-wider mb-0.5">Hlavná charakteristika / USP</p>
                        <p className="text-[#63c1cf] text-xs font-medium italic">{verificationData.usp}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={handleVerificationConfirm}
                    className="w-full py-3.5 bg-[#63c1cf] hover:bg-[#4ab5c4] text-[#141313] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(99,193,207,0.2)] hover:shadow-[0_0_20px_rgba(99,193,207,0.4)] flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Áno, pokračovať v analýze
                  </button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#333]"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                      <span className="px-3 bg-[#141313] text-[#666] font-bold uppercase tracking-tighter">nepresné? zadajte správne odvetvie</span>
                    </div>
                  </div>

                  <form onSubmit={(e: any) => {
                    e.preventDefault();
                    const val = (e.target.industryInput as HTMLInputElement).value;
                    if (val) handleVerificationEdit(val);
                  }} className="flex gap-2">
                    <input
                      name="industryInput"
                      type="text"
                      placeholder="Napr. Predaj bicyklov"
                      className="flex-1 bg-[#1f1f1f] border border-[#333] rounded-lg px-4 py-2 text-sm text-[#f7f7f7] focus:border-[#63c1cf] focus:outline-none transition-all"
                      defaultValue={pendingRequest?.industry}
                    />
                    <button type="submit" className="px-5 py-2 bg-[#333] hover:bg-[#444] text-[#f7f7f7] rounded-lg font-bold text-sm transition-all whitespace-nowrap">
                      Opraviť
                    </button>
                  </form>
                </div>
              </div>

            )}
          </div>
        )}

        {status === 'analyzing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <InputSection onAnalyze={() => { }} isLoading={true} />
            <div className="mt-8 text-[#141313] text-sm animate-pulse text-center">
            <div className="mt-8 text-[#141313] text-sm animate-pulse text-center">
              <p>Daj mi chvíľu, pracujem na tvojej analýze...</p>
            </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="max-w-2xl mx-auto mt-10 p-6 bg-[#141313] border border-[#f27069]/50 rounded-xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-[#f27069] shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-[#f7f7f7]">Analýza Zlyhala</h3>
              <p className="text-[#c5c5c5] mt-2">{errorMsg}</p>
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 bg-[#f27069] hover:bg-[#d45f59] text-[#141313] rounded-lg text-sm font-bold transition-colors"
              >
                Skúsiť Znova
              </button>
            </div>
          </div>
        )}

        {status === 'complete' && result && (
          <div className="animate-fade-in-up pb-12">
            <ClientAnalysisCard data={result.clientAnalysis} />

            <CompetitorTable
              title="Dominanti trhu"
              description="Top 5 najväčších spoločností v segmente (Benchmarking)."
              competitors={result.topCompetitors}
              icon={<Crown className="w-5 h-5 text-[#63c1cf]" />}
              countryCode={result.clientAnalysis.countryCode}
            />

            <CompetitorTable
              title="Priama konkurencia"
              description="Reálni konkurenti s podobným obratom a portfóliom."
              competitors={result.realCompetitors}
              icon={<Zap className="w-5 h-5 text-[#63c1cf]" />}
              countryCode={result.clientAnalysis.countryCode}
            />

            <USPSection data={result.uspAnalysis} />

            {result.sources && result.sources.length > 0 && (
              <div className="bg-[#141313]/50 border border-[#333]/50 rounded-xl p-6">
                <button
                  onClick={() => setIsSourcesVisible(!isSourcesVisible)}
                  className="flex items-center justify-between w-full text-left group"
                  aria-expanded={isSourcesVisible}
                >
                  <h4 className="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider group-hover:text-[#c5c5c5] transition-colors">
                    Zdroje
                  </h4>
                  {isSourcesVisible ? (
                    <ChevronUp className="w-5 h-5 text-[#c5c5c5] group-hover:text-[#f7f7f7] transition-colors" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#c5c5c5] group-hover:text-[#f7f7f7] transition-colors" />
                  )}
                </button>

                {isSourcesVisible && (
                  <div className="mt-4 pt-4 border-t border-[#333] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in-up">
                    {result.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 p-3 rounded-lg bg-[#141313] border border-[#333] hover:border-[#63c1cf] transition-colors group"
                      >
                        <ExternalLink className="w-3 h-3 text-[#a0a0a0] mt-1 group-hover:text-[#63c1cf]" />
                        <div>
                          <div className="text-sm text-[#c5c5c5] font-medium group-hover:text-[#63c1cf] line-clamp-1">{source.title}</div>
                          <div className="text-xs text-[#a0a0a0] line-clamp-1 break-all">{source.uri}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
