import { Mic, Brain, Volume2, ArrowRight } from "lucide-react";

export function VoicePipelineDiagram() {
  return (
    <div className="my-6 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[#27272f] bg-[#0f0f14] p-6">
      <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <Mic size={24} className="text-green-400" />
        <span className="text-xs font-medium text-green-400">Senin Sesin</span>
      </div>
      <ArrowRight size={20} className="text-[#55555f] shrink-0" />
      <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <span className="text-xs font-bold text-blue-400">STT</span>
        <span className="text-[10px] text-blue-400/70">Freya STT</span>
      </div>
      <ArrowRight size={20} className="text-[#55555f] shrink-0" />
      <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg bg-[#e5a10e]/10 border border-[#e5a10e]/20">
        <Brain size={24} className="text-[#e5a10e]" />
        <span className="text-xs font-medium text-[#e5a10e]">AI LLM</span>
      </div>
      <ArrowRight size={20} className="text-[#55555f] shrink-0" />
      <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <span className="text-xs font-bold text-purple-400">TTS</span>
        <span className="text-[10px] text-purple-400/70">Freya TTS</span>
      </div>
      <ArrowRight size={20} className="text-[#55555f] shrink-0" />
      <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <Volume2 size={24} className="text-orange-400" />
        <span className="text-xs font-medium text-orange-400">AI Yanıtı</span>
      </div>
    </div>
  );
}
