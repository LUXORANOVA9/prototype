import React from 'react';
import { AuditReport, AuditFinding } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle2, Info, Activity, Server, AlertOctagon, Wrench } from 'lucide-react';

interface Props {
  report: AuditReport;
}

export const AuditReportCard: React.FC<Props> = ({ report }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-100 dark:bg-red-950/30 border-red-200 dark:border-red-900/50';
      case 'high': return 'text-orange-500 bg-orange-100 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50';
      case 'medium': return 'text-amber-500 bg-amber-100 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50';
      case 'low': return 'text-blue-500 bg-blue-100 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50';
      default: return 'text-zinc-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertOctagon size={14} />;
      case 'high': return <AlertTriangle size={14} />;
      case 'medium': return <Activity size={14} />;
      case 'low': return <Info size={14} />;
      default: return <Info size={14} />;
    }
  };

  // Calculate score color
  const scoreColor = report.score >= 90 ? 'text-emerald-500' : report.score >= 70 ? 'text-amber-500' : 'text-red-500';
  const scoreStroke = report.score >= 90 ? '#10b981' : report.score >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                    <Server size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider brand-font">System Audit</h3>
                    <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                        <span>{report.target}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                        <span>{new Date(report.timestamp).toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
            
            {/* Score Ring */}
            <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-zinc-200 dark:text-zinc-800" />
                    <circle 
                        cx="24" cy="24" r="20" fill="none" stroke={scoreStroke} strokeWidth="4" 
                        strokeDasharray={126} 
                        strokeDashoffset={126 - (126 * report.score) / 100} 
                        className="transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                    />
                </svg>
                <span className={`absolute text-[10px] font-bold ${scoreColor}`}>{report.score}</span>
            </div>
        </div>

        {/* Summary */}
        <div className="p-5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-b border-zinc-200 dark:border-white/5">
            {report.summary}
        </div>

        {/* Findings List */}
        <div className="p-5 space-y-3 bg-zinc-50/50 dark:bg-black/20">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Detected Anomalies</div>
            
            {report.findings.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-xs p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-900/20">
                    <CheckCircle2 size={16} />
                    <span>No critical issues detected. System operational.</span>
                </div>
            ) : (
                report.findings.map(finding => (
                    <div key={finding.id} className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                        <div className="flex items-start gap-3 p-3">
                            <div className={`mt-0.5 p-1.5 rounded-md flex-shrink-0 ${getSeverityColor(finding.severity)}`}>
                                {getSeverityIcon(finding.severity)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{finding.title}</span>
                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getSeverityColor(finding.severity)}`}>
                                        {finding.severity}
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-500 leading-relaxed mb-2">{finding.description}</p>
                                
                                {finding.remediation && (
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                                        <div className="flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-900/10 px-2 py-1 rounded">
                                            <Wrench size={10} /> Suggested Fix: {finding.remediation}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};