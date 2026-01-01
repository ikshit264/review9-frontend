'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/api/useAuth';
import { UserRole, SubscriptionPlan } from '@/types';
import { JobCard } from '@/components/dashboard/JobCard';
import { JobModal } from '@/components/dashboard/JobModal';
import { NotificationDropdown } from '@/components/dashboard/NotificationDropdown';
import { useDashboardPageApi } from '@/hooks/api/useDashboardPageApi';
import { useToast } from '@/hooks/useToast';
import { Sidebar } from '@/components/dashboard/Sidebar';

import {
  Briefcase,
  Plus,
  Search,
  User as UserIcon,
  Monitor,
  Calendar,
  ChevronRight,
  BrainCircuit,
  TrendingUp
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useStore();
  const { logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const { createJobMutation, useJobsQuery } = useDashboardPageApi();
  const { data: jobs = [], isLoading: jobsLoading } = useJobsQuery();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  // Polling state for invitations
  const [isInviting, setIsInviting] = useState(false);
  const [invitationProgress, setInvitationProgress] = useState<{
    total: number;
    current: number;
    succeeded: number;
    failed: number;
    details: any[];
  }>({ total: 0, current: 0, succeeded: 0, failed: 0, details: [] });

  useEffect(() => {
    if (user?.role === UserRole.CANDIDATE) {
      setInvitesLoading(true);
      import('@/services/api').then(({ interviewsApi }) => {
        interviewsApi.getMyInvitations()
          .then(data => {
            setInvitations(data);
            setInvitesLoading(false);
          })
          .catch(err => {
            console.error("Failed to fetch invitations:", err);
            setInvitesLoading(false);
          });
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  const isLoading = jobsLoading || invitesLoading;

  const handleCreateJob = async (data: any) => {
    try {
      const newJob = await createJobMutation.mutateAsync({
        ...data,
        description: data.notes || 'No description provided.',
        roleCategory: data.role,
      });
      toast.success("Job posted successfully!");

      if (data.emails?.length > 0) {
        setIsInviting(true);
        const { jobsApi } = await import('@/services/api');
        await jobsApi.inviteCandidates(newJob.id, {
          candidates: data.emails.map((email: string) => ({
            name: email.split('@')[0],
            email
          }))
        });
        setIsInviting(false);
        setIsJobModalOpen(false);
      } else {
        setIsJobModalOpen(false);
      }
    } catch (err) {
      toast.error("Failed to post job.");
      setIsInviting(false);
    }
  };

  const dashboardStats = [
    { label: 'Active Jobs', value: jobs.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Applicants', value: jobs.reduce((acc, j) => acc + (j.candidateCount || 0), 0), icon: UserIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Efficiency Gain', value: '+24%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'AI Match Rate', value: '89%', icon: BrainCircuit, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFE] text-slate-900 selection:bg-blue-100">
      <div className="flex relative z-10">
        <Sidebar />
        {/* Main Content */}
        <main className="flex-grow p-4 lg:p-12 max-w-[1600px] mx-auto w-full">
          {/* Header Area */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">{user.role}</span>
                <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workspace ID: {user.id?.slice(0, 8)}</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
                Welcome back, {user.name.split(' ')[0]}
                <span className="text-blue-600">.</span>
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <div className="h-10 w-[1px] bg-gray-100 mx-2"></div>
              {user.role === UserRole.COMPANY ? (
                <button
                  onClick={() => setIsJobModalOpen(true)}
                  className="group flex items-center space-x-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post New Opportunity</span>
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{user.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Candidate</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black shadow-inner">
                    {user.name[0]}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Content Grid */}
          <div className="space-y-12">
            {user.role === UserRole.COMPANY && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardStats.map((stat, i) => (
                  <div key={i} className="p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-blue-100 group">
                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-black tracking-tighter mb-1 text-slate-900">{stat.value}</div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Jobs / Interviews Section */}
            <section>


              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-72 rounded-[2.5rem] bg-gray-50/50 animate-pulse border border-gray-100"></div>
                  ))}
                </div>
              ) : user.role === UserRole.COMPANY ? (
                jobs.length === 0 ? (
                  <div className="relative p-24 rounded-[3rem] border-2 border-dashed border-gray-100 bg-gray-50/30 flex flex-col items-center justify-center text-center overflow-hidden">
                    <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-8 border border-gray-50">
                      <Plus className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 mb-2">No active pipelines</h3>
                    <p className="text-gray-400 font-medium max-w-xs text-sm leading-relaxed">Your hiring dashboard is empty. Post your first job to start using HireAI.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {jobs.map(job => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onViewDetails={(id, name) => router.push(`/${name}/${id}`)}
                      />
                    ))}
                  </div>
                )
              ) : (
                /* Candidate View Implementation */
                <div className="space-y-12">
                  {invitations.length === 0 ? (
                    <div className="p-24 rounded-[3rem] border-2 border-dashed border-gray-100 bg-gray-50/30 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-8 border border-gray-50">
                        <Monitor className="w-8 h-8 text-indigo-500" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 mb-2">Dashboard Clear</h3>
                      <p className="text-gray-400 font-medium text-sm max-w-xs">You have no pending AI assessments. New invitations will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {invitations.map(inv => (
                        <div
                          key={inv.id}
                          className="group relative p-8 rounded-[2.5rem] bg-white border border-gray-100 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all cursor-pointer backdrop-blur-xl"
                          onClick={() => router.push(`/interview/${inv.interviewLink}`)}
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500`}>
                              <Monitor className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5">{inv.job.company.name}</span>
                              <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">Live Session</span>
                              </div>
                            </div>
                          </div>
                          <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase group-hover:text-indigo-600 transition-colors tracking-tight leading-none">{inv.job.title}</h3>
                          <p className="text-sm text-gray-400 font-medium mb-8 line-clamp-2 leading-relaxed">{inv.job.description}</p>

                          <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center space-x-2.5 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span className="text-[11px] font-bold text-slate-600">{new Date(inv.job.scheduledTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <button className="flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-all">
                              <span>Enter Session</span>
                              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <JobModal
        isOpen={isJobModalOpen}
        onClose={() => !isInviting && setIsJobModalOpen(false)}
        onSubmit={handleCreateJob}
        plan={user.plan || SubscriptionPlan.FREE}
        isInviting={isInviting}
        invitationProgress={invitationProgress}
      />
    </div>
  );
}
