'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Megaphone,
  FileText,
  Video,
  Search,
  FlaskConical,
  Sparkles,
  Plus,
  Loader2,
  MessageSquare,
  ExternalLink,
  Calendar,
  DollarSign,
  Target,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  campaign_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  goals: Record<string, unknown>;
  budget_usd: number | null;
  created_at: string;
}

interface Asset {
  id: string;
  title: string;
  asset_type: string;
  status: string;
  platform: string | null;
  content: Record<string, unknown>;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  published: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  copy: 'Copy',
  email: 'Email',
  social_post: 'Social Post',
  ad_creative: 'Ad Creative',
  video: 'Video',
  landing_page: 'Landing Page',
  blog: 'Blog Post',
  product_context: 'Product Context',
};

const CAMPAIGN_TYPES = [
  { value: 'launch', label: 'Product Launch' },
  { value: 'content', label: 'Content Marketing' },
  { value: 'paid', label: 'Paid Advertising' },
  { value: 'seo', label: 'SEO Campaign' },
  { value: 'email', label: 'Email Marketing' },
];

const ASSET_TYPES = [
  { value: 'copy', label: 'Website Copy' },
  { value: 'email', label: 'Email' },
  { value: 'social_post', label: 'Social Post' },
  { value: 'ad_creative', label: 'Ad Creative' },
  { value: 'blog', label: 'Blog Post' },
  { value: 'landing_page', label: 'Landing Page' },
];

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'email', label: 'Email' },
];

export default function MarketingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contextGenerating, setContextGenerating] = useState(false);
  const [generatedContext, setGeneratedContext] = useState<Record<string, unknown> | null>(null);

  // Form states
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    campaign_type: 'content',
    budget_usd: '',
  });

  const [assetForm, setAssetForm] = useState({
    title: '',
    asset_type: 'copy',
    platform: '',
    headline: '',
    body: '',
    cta: '',
  });

  // Fetch projects
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const projectList = Array.isArray(data) ? data : [];
        setProjects(projectList);
        if (projectList.length > 0 && !selectedProject) {
          setSelectedProject(projectList[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch campaigns and assets
  const fetchData = useCallback(() => {
    if (!selectedProject) return;

    Promise.all([
      fetch(`/api/marketing/campaigns?project_id=${selectedProject}`).then(r => r.json()),
      fetch(`/api/marketing/assets?project_id=${selectedProject}`).then(r => r.json()),
    ])
      .then(([campaignData, assetData]) => {
        setCampaigns(Array.isArray(campaignData) ? campaignData : []);
        setAssets(Array.isArray(assetData) ? assetData : []);
      })
      .catch(console.error);
  }, [selectedProject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create campaign
  const handleCreateCampaign = async () => {
    if (!selectedProject || !campaignForm.title) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          title: campaignForm.title,
          description: campaignForm.description || null,
          campaign_type: campaignForm.campaign_type,
          budget_usd: campaignForm.budget_usd ? parseFloat(campaignForm.budget_usd) : null,
        }),
      });

      if (res.ok) {
        setShowCampaignModal(false);
        setCampaignForm({ title: '', description: '', campaign_type: 'content', budget_usd: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create asset
  const handleCreateAsset = async () => {
    if (!selectedProject || !assetForm.title) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/marketing/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          title: assetForm.title,
          asset_type: assetForm.asset_type,
          platform: assetForm.platform || null,
          content: {
            headline: assetForm.headline || null,
            body: assetForm.body || null,
            cta: assetForm.cta || null,
          },
          status: 'draft',
        }),
      });

      if (res.ok) {
        setShowAssetModal(false);
        setAssetForm({ title: '', asset_type: 'copy', platform: '', headline: '', body: '', cta: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate product context
  const handleGenerateContext = async () => {
    if (!selectedProject) return;

    setContextGenerating(true);
    setShowContextModal(true);
    setGeneratedContext(null);

    try {
      const res = await fetch('/api/marketing/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: selectedProject }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedContext(data.context || data);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to generate context:', error);
    } finally {
      setContextGenerating(false);
    }
  };

  // Stats
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const draftAssets = assets.filter(a => a.status === 'draft').length;
  const publishedAssets = assets.filter(a => a.status === 'published').length;
  const videoAssets = assets.filter(a => a.asset_type === 'video').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Marketing Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create campaigns, content, and videos for your projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href="/chat">
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask CMO
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">{campaigns.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Assets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">{draftAssets} drafts, {publishedAssets} published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videoAssets}</div>
            <p className="text-xs text-muted-foreground">Remotion-powered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marketing Skills</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground">7 categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaigns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Campaigns</h2>
            <Button size="sm" onClick={() => setShowCampaignModal(true)} disabled={!selectedProject}>
              <Plus className="h-4 w-4 mr-1" />
              New Campaign
            </Button>
          </div>

          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No campaigns yet</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setShowCampaignModal(true)}
                  disabled={!selectedProject}
                >
                  Create your first campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {campaigns.map(campaign => (
                <Card key={campaign.id} className="hover:bg-accent/30 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{campaign.title}</h3>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline">{campaign.campaign_type}</Badge>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[campaign.status] || ''}`}>
                            {campaign.status}
                          </span>
                          {campaign.budget_usd && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {Number(campaign.budget_usd).toLocaleString()}
                            </span>
                          )}
                          {campaign.start_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(campaign.start_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Recent Assets */}
          <div className="flex items-center justify-between mt-6">
            <h2 className="text-lg font-semibold">Recent Assets</h2>
            <Button size="sm" variant="outline" onClick={() => setShowAssetModal(true)} disabled={!selectedProject}>
              <Plus className="h-4 w-4 mr-1" />
              New Asset
            </Button>
          </div>

          {assets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No content assets yet</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setShowAssetModal(true)}
                  disabled={!selectedProject}
                >
                  Create your first asset
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {assets.slice(0, 8).map(asset => (
                <Card key={asset.id} className="hover:bg-accent/30 transition-colors cursor-pointer">
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{asset.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type}
                          </Badge>
                          {asset.platform && (
                            <span className="text-xs text-muted-foreground">{asset.platform}</span>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS_COLORS[asset.status] || ''}`}>
                        {asset.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Quick Actions + Skills */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              size="sm"
              onClick={handleGenerateContext}
              disabled={!selectedProject || contextGenerating}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Product Context
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              size="sm"
              onClick={() => {
                setAssetForm(prev => ({ ...prev, asset_type: 'social_post' }));
                setShowAssetModal(true);
              }}
              disabled={!selectedProject}
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Social Posts
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              size="sm"
              onClick={() => {
                setAssetForm(prev => ({ ...prev, asset_type: 'video' }));
                setShowAssetModal(true);
              }}
              disabled={!selectedProject}
            >
              <Video className="h-4 w-4 mr-2" />
              Create Video
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm" disabled={!selectedProject}>
              <Search className="h-4 w-4 mr-2" />
              Run SEO Audit
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm" disabled={!selectedProject}>
              <FlaskConical className="h-4 w-4 mr-2" />
              Design A/B Test
            </Button>
          </div>

          <h2 className="text-lg font-semibold mt-6">Marketing Skills</h2>
          <div className="space-y-3">
            {[
              { category: 'Content', skills: ['copywriting', 'social-content', 'email-sequence', 'ad-creative'], color: 'bg-blue-500' },
              { category: 'CRO', skills: ['page-cro', 'signup-flow-cro', 'onboarding-cro'], color: 'bg-green-500' },
              { category: 'SEO', skills: ['seo-audit', 'ai-seo', 'programmatic-seo'], color: 'bg-yellow-500' },
              { category: 'Strategy', skills: ['launch-strategy', 'pricing-strategy', 'customer-research'], color: 'bg-purple-500' },
              { category: 'Growth', skills: ['referral-program', 'lead-magnets', 'churn-prevention'], color: 'bg-pink-500' },
            ].map(group => (
              <Card key={group.category}>
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${group.color}`} />
                    <p className="font-medium text-sm">{group.category}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {group.skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign Creation Modal */}
      <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              Set up a new marketing campaign for your project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-title">Campaign Name</Label>
              <Input
                id="campaign-title"
                placeholder="e.g., Q2 Product Launch"
                value={campaignForm.title}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-desc">Description</Label>
              <Textarea
                id="campaign-desc"
                placeholder="Describe the campaign goals and strategy..."
                value={campaignForm.description}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign Type</Label>
                <Select
                  value={campaignForm.campaign_type}
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, campaign_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-budget">Budget (USD)</Label>
                <Input
                  id="campaign-budget"
                  type="number"
                  placeholder="5000"
                  value={campaignForm.budget_usd}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, budget_usd: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignModal(false)}>Cancel</Button>
            <Button onClick={handleCreateCampaign} disabled={!campaignForm.title || isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Creation Modal */}
      <Dialog open={showAssetModal} onOpenChange={setShowAssetModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Content Asset</DialogTitle>
            <DialogDescription>
              Create a new piece of marketing content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="asset-title">Asset Name</Label>
              <Input
                id="asset-title"
                placeholder="e.g., Homepage Hero Copy"
                value={assetForm.title}
                onChange={(e) => setAssetForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select
                  value={assetForm.asset_type}
                  onValueChange={(value) => setAssetForm(prev => ({ ...prev, asset_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Platform (optional)</Label>
                <Select
                  value={assetForm.platform}
                  onValueChange={(value) => setAssetForm(prev => ({ ...prev, platform: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-headline">Headline</Label>
              <Input
                id="asset-headline"
                placeholder="Main headline or subject line"
                value={assetForm.headline}
                onChange={(e) => setAssetForm(prev => ({ ...prev, headline: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-body">Body Copy</Label>
              <Textarea
                id="asset-body"
                placeholder="Main content..."
                value={assetForm.body}
                onChange={(e) => setAssetForm(prev => ({ ...prev, body: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-cta">Call to Action</Label>
              <Input
                id="asset-cta"
                placeholder="e.g., Start Free Trial"
                value={assetForm.cta}
                onChange={(e) => setAssetForm(prev => ({ ...prev, cta: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssetModal(false)}>Cancel</Button>
            <Button onClick={handleCreateAsset} disabled={!assetForm.title || isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Context Generation Modal */}
      <Dialog open={showContextModal} onOpenChange={setShowContextModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Product Marketing Context</DialogTitle>
            <DialogDescription>
              AI-generated positioning and messaging foundation for your product.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {contextGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Generating product context with AI...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take 30-60 seconds</p>
              </div>
            ) : generatedContext ? (
              <div className="space-y-4 text-sm">
                {Object.entries(generatedContext).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="font-medium text-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                    <div className="text-muted-foreground bg-muted/50 rounded-md p-3">
                      {typeof value === 'string' ? (
                        <p className="whitespace-pre-wrap">{value}</p>
                      ) : Array.isArray(value) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {value.map((item, i) => (
                            <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
                          ))}
                        </ul>
                      ) : (
                        <pre className="text-xs overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No context generated yet.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContextModal(false)}>Close</Button>
            {generatedContext && (
              <Button variant="outline" onClick={handleGenerateContext} disabled={contextGenerating}>
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
