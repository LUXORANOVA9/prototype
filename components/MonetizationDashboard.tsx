import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Zap, Users, Crown, Star, TrendingUp, ArrowUpRight,
  ArrowDownRight, Clock, Check, X, Gift, Shield, Sparkles, BarChart3,
  Wallet, Coins, Receipt, RefreshCw, Download, Settings
} from 'lucide-react';

// --- Types ---
interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  timestamp: number;
  agent?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  credits: number;
  features: string[];
  isCurrent: boolean;
  isPopular: boolean;
}

// --- Data ---
const PLANS: Plan[] = [
  {
    id: 'free', name: 'Starter', price: 0, period: 'month', credits: 100,
    features: ['100 AI credits/month', '3 agents', 'Basic chat', 'Community support'],
    isCurrent: true, isPopular: false,
  },
  {
    id: 'pro', name: 'Pro', price: 19, period: 'month', credits: 5000,
    features: ['5,000 AI credits/month', 'All 12 agents', 'Factory Floor', 'Priority support', 'API access'],
    isCurrent: false, isPopular: true,
  },
  {
    id: 'team', name: 'Team', price: 49, period: 'month', credits: 20000,
    features: ['20,000 AI credits/month', 'Up to 10 users', 'War Rooms', 'Shared agents', 'Analytics', 'SSO'],
    isCurrent: false, isPopular: false,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 199, period: 'month', credits: 100000,
    features: ['100,000 AI credits/month', 'Unlimited users', 'Custom agents', 'Dedicated support', 'SLA', 'On-premise option'],
    isCurrent: false, isPopular: false,
  },
];

const TRANSACTIONS: CreditTransaction[] = [
  { id: 't1', type: 'purchase', amount: 5000, description: 'Pro Plan - Monthly', timestamp: Date.now() - 86400000 * 2 },
  { id: 't2', type: 'usage', amount: -150, description: 'Chat completion (Gemini Pro)', timestamp: Date.now() - 86400000, agent: 'Overseer' },
  { id: 't3', type: 'usage', amount: -75, description: 'Image generation', timestamp: Date.now() - 43200000, agent: 'Visionary' },
  { id: 't4', type: 'bonus', amount: 500, description: 'Referral bonus', timestamp: Date.now() - 36000000 },
  { id: 't5', type: 'usage', amount: -200, description: 'Code generation + review', timestamp: Date.now() - 7200000, agent: 'Developer' },
  { id: 't6', type: 'usage', amount: -50, description: 'Web search + summarization', timestamp: Date.now() - 3600000, agent: 'Researcher' },
];

const AGENT_COSTS = [
  { name: 'Overseer', icon: 'Brain', color: '#f59e0b', creditsPerTask: 50, tasksToday: 12 },
  { name: 'Developer', icon: 'Code', color: '#3b82f6', creditsPerTask: 30, tasksToday: 8 },
  { name: 'Visionary', icon: 'Sparkles', color: '#a855f7', creditsPerTask: 75, tasksToday: 5 },
  { name: 'Director', icon: 'Film', color: '#ec4899', creditsPerTask: 100, tasksToday: 2 },
  { name: 'Researcher', icon: 'Globe', color: '#22c55e', creditsPerTask: 25, tasksToday: 15 },
  { name: 'Data Analyst', icon: 'BarChart3', color: '#06b6d4', creditsPerTask: 40, tasksToday: 6 },
];

// --- Main Dashboard ---
export default function MonetizationDashboard() {
  const [balance] = useState(4525);
  const [transactions] = useState<CreditTransaction[]>(TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'usage' | 'billing'>('overview');

  const totalUsed = transactions.filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalPurchased = transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex flex-col h-full bg-[#02050A] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Wallet size={16} className="text-yellow-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">Credits & Billing</div>
            <div className="text-[10px] text-white/30 font-mono">MONETIZATION DASHBOARD</div>
          </div>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-mono hover:bg-amber-500/20 transition-all cursor-pointer">
          <Zap size={12} /> Buy Credits
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 shrink-0">
        {[
          { id: 'overview' as const, label: 'Overview' },
          { id: 'plans' as const, label: 'Plans' },
          { id: 'usage' as const, label: 'Usage' },
          { id: 'billing' as const, label: 'Billing' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'text-amber-500 border-b border-amber-500'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] text-amber-500/60 font-mono uppercase tracking-wider">Available Credits</div>
                  <div className="text-4xl font-bold mt-1">{balance.toLocaleString()}</div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <Coins size={28} className="text-amber-500" />
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono text-white/40">
                <span className="flex items-center gap-1">
                  <ArrowDownRight size={12} className="text-red-400" />
                  {totalUsed} used this month
                </span>
                <span className="flex items-center gap-1">
                  <ArrowUpRight size={12} className="text-emerald-400" />
                  {totalPurchased} purchased
                </span>
              </div>

              {/* Usage bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[9px] text-white/30 font-mono mb-1">
                  <span>Monthly usage</span>
                  <span>{totalUsed} / 5,000</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all" style={{ width: `${(totalUsed / 5000) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Agent Costs */}
            <div>
              <div className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-3">Agent Cost Breakdown</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {AGENT_COSTS.map(agent => (
                  <div key={agent.name} className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: agent.color }} />
                      <span className="text-[10px] font-medium">{agent.name}</span>
                    </div>
                    <div className="text-lg font-bold">{agent.creditsPerTask}</div>
                    <div className="text-[8px] text-white/30 font-mono">credits/task · {agent.tasksToday} today</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <div className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-3">Recent Transactions</div>
              <div className="space-y-2">
                {transactions.slice(0, 6).map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.type === 'purchase' ? 'bg-emerald-500/10' :
                      tx.type === 'bonus' ? 'bg-blue-500/10' :
                      'bg-red-500/10'
                    }`}>
                      {tx.type === 'purchase' ? <ArrowUpRight size={14} className="text-emerald-500" /> :
                       tx.type === 'bonus' ? <Gift size={14} className="text-blue-500" /> :
                       <ArrowDownRight size={14} className="text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{tx.description}</div>
                      <div className="text-[9px] text-white/30 font-mono">
                        {new Date(tx.timestamp).toLocaleDateString()} {tx.agent && `· ${tx.agent}`}
                      </div>
                    </div>
                    <div className={`text-sm font-bold font-mono ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={`relative border rounded-2xl p-5 transition-all ${
                  plan.isPopular
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : plan.isCurrent
                    ? 'bg-white/[0.02] border-white/10'
                    : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-bold uppercase">
                    Most Popular
                  </div>
                )}
                {plan.isCurrent && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-mono uppercase">
                    Current
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-sm text-white/30">/{plan.period}</span>
                  </div>
                  <div className="text-[10px] text-white/30 font-mono mt-1">{plan.credits.toLocaleString()} credits/month</div>
                </div>

                <div className="space-y-2 mb-5">
                  {plan.features.map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-xs text-white/50">
                      <Check size={12} className="text-amber-500 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  plan.isCurrent
                    ? 'bg-white/5 text-white/40 cursor-default'
                    : plan.isPopular
                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}>
                  {plan.isCurrent ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-2">Full Transaction History</div>
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.type === 'purchase' ? 'bg-emerald-500/10' :
                  tx.type === 'bonus' ? 'bg-blue-500/10' :
                  tx.type === 'refund' ? 'bg-amber-500/10' :
                  'bg-red-500/10'
                }`}>
                  {tx.type === 'purchase' ? <ArrowUpRight size={14} className="text-emerald-500" /> :
                   tx.type === 'bonus' ? <Gift size={14} className="text-blue-500" /> :
                   tx.type === 'refund' ? <RefreshCw size={14} className="text-amber-500" /> :
                   <ArrowDownRight size={14} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{tx.description}</div>
                  <div className="text-[9px] text-white/25 font-mono">
                    {new Date(tx.timestamp).toLocaleString()} {tx.agent && `· ${tx.agent}`}
                  </div>
                </div>
                <div className={`text-sm font-bold font-mono ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-3">Payment Method</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center text-[9px] font-bold">
                  VISA
                </div>
                <div>
                  <div className="text-xs font-medium">•••• •••• •••• 4242</div>
                  <div className="text-[9px] text-white/30">Expires 12/27</div>
                </div>
                <button className="ml-auto text-[10px] text-amber-500 hover:underline cursor-pointer">Change</button>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-3">Billing History</div>
              <div className="space-y-2">
                {[
                  { date: 'Mar 1, 2026', amount: '$19.00', status: 'Paid' },
                  { date: 'Feb 1, 2026', amount: '$19.00', status: 'Paid' },
                  { date: 'Jan 1, 2026', amount: '$19.00', status: 'Paid' },
                ].map((inv, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="text-xs text-white/50">{inv.date}</div>
                    <div className="text-xs font-medium">{inv.amount}</div>
                    <div className="flex items-center gap-1 text-[9px] text-emerald-500">
                      <Check size={10} /> {inv.status}
                    </div>
                    <button className="text-[9px] text-white/30 hover:text-white/50 cursor-pointer">
                      <Download size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/40 text-[9px] font-mono text-white/20">
        <span>Pro Plan · 5,000 credits/month</span>
        <span>Luxor9 Ai Factory — Credits</span>
      </div>
    </div>
  );
}
