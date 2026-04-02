'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HeroSection, HeroSectionComponentData } from '@/components/ui/hero-section';
import { Card } from '@/components/ui/card';
import { GroupListItem } from '@/lib/types';

export default function Dashboard() {
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadGroups() {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        setGroups(await res.json());
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const heroData: HeroSectionComponentData = {
    navbar: {
      logoText: 'CrUX Tracker',
      navLinks: [],
      authLinks: [{ text: '+ Add Group', href: '/groups/new', type: 'button-primary' }],
    },
    heroContent: {
      subheadline: 'Core Web Vitals Intelligence',
      headline: 'Track & Compare CrUX Data Across URLs',
      description:
        "Monitor Core Web Vitals trends for your brand and competitors. Powered by Google's Chrome UX Report API.",
      primaryCtaText: groups.length === 0 ? 'Add Your First Group' : '',
      primaryCtaLink: '/groups/new',
      secondaryCtaText: '',
      secondaryCtaLink: '#',
    },
    appPreview: {
      headerControls: {
        filters: [
          { label: 'All Groups', dropdown: true },
          { label: 'Status', icon: 'check-circle', dropdown: true },
        ],
        actions: [{ type: 'button-primary', text: 'New Group', icon: 'plus', href: '/groups/new' }],
      },
      appDataTable: {
        headers: [
          { id: 'name', label: 'Group Name', icon: 'document' },
          { id: 'urls', label: 'URLs', icon: 'user' },
          { id: 'status', label: 'Status', icon: 'info' },
          { id: 'fetched', label: 'Last Fetched', icon: 'calendar' },
          { id: 'created', label: 'Created', icon: 'folder' },
        ],
        data: groups.map((g) => ({
          name: g.name,
          assignee: [`${g.url_count} URL${g.url_count !== 1 ? 's' : ''}`],
          status: g.last_fetched_at ? 'Active' : 'Pending',
          statusColor: g.last_fetched_at ? 'green' : 'yellow',
          dueDate: g.last_fetched_at
            ? new Date(g.last_fetched_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Never',
          project: new Date(g.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        })),
      },
    },
  };

  const steps = [
    {
      number: '01',
      title: 'Create a Keyword Group',
      description: 'Group competitor URLs by topic or keyword — e.g. "Burj Khalifa tours" with all competing brand URLs.',
    },
    {
      number: '02',
      title: 'Add URLs to Track',
      description: 'Paste the URLs you want to compare. Each URL maps to a brand name so you can tell them apart at a glance.',
    },
    {
      number: '03',
      title: 'Run Now',
      description: 'Hit "Run Now" to fetch the latest CrUX data from Google\'s Chrome UX Report API for all URLs in the group.',
    },
    {
      number: '04',
      title: 'Compare Core Web Vitals',
      description: 'View TTFB, FCP, LCP, CLS and INP trends over time — side-by-side across all brands in the group.',
    },
  ];

  return (
    <div>
      <HeroSection
        data={heroData}
        showNavbar={false}
        showBackground={false}
        onRowClick={(index) => {
          if (groups[index]) {
            router.push(`/groups/${groups[index].id}`);
          }
        }}
      />

      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-2">How it works</h2>
        <p className="text-sm text-gray-500 mb-6">Get up and running in four steps.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <Card key={step.number}>
              <Card.Content className="pt-6">
                <span className="text-3xl font-black text-gray-100">{step.number}</span>
                <h3 className="text-sm font-semibold text-gray-900 mt-2 mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
              </Card.Content>
            </Card>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/groups/new"
            className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + Create your first group
          </Link>
        </div>
      </div>
    </div>
  );
}
