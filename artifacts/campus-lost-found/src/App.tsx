import { type FormEvent, type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Compass,
  Filter,
  HeartHandshake,
  ImagePlus,
  Landmark,
  LoaderCircle,
  MapPin,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
  Zap,
} from 'lucide-react';
import {
  Category,
  getGetDashboardStatsQueryKey,
  getGetItemQueryKey,
  getGetRecentItemsQueryKey,
  getHealthCheckQueryKey,
  getListItemMatchesQueryKey,
  getListItemsQueryKey,
  type DashboardStats,
  type Item,
  type ItemInput,
  type ItemMatch,
  type ListItemsParams,
  useCreateItem,
  useGetDashboardStats,
  useGetItem,
  useGetRecentItems,
  useHealthCheck,
  useListItemMatches,
  useListItems,
  useTriggerMatch,
  useUpdateItem,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';

const queryClient = new QueryClient();
const categories = Object.values(Category);

function formatDate(value: string) {
  if (!value) return 'Time not added';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatTime(value: string) {
  if (!value) return 'Time not added';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function ReportBadge({ type }: { type: Item['report_type'] }) {
  const isLost = type === 'lost';
  return (
    <span className={`report-badge ${isLost ? 'report-badge-lost' : 'report-badge-found'}`} data-testid={`status-report-type-${type}`}>
      <span className="report-badge-dot" />
      {isLost ? 'Lost report' : 'Found report'}
    </span>
  );
}

function StatusBadge({ status }: { status: Item['status'] }) {
  return (
    <span className={`status-badge ${status === 'resolved' ? 'status-badge-resolved' : 'status-badge-active'}`} data-testid={`status-item-${status}`}>
      {status === 'resolved' ? <Check size={12} strokeWidth={3} /> : <span className="status-pulse" />}
      {status === 'resolved' ? 'Resolved' : 'Active'}
    </span>
  );
}

function ItemCard({ item, compact = false }: { item: Item; compact?: boolean }) {
  return (
    <Link href={`/item/${item.id}`} className={`item-card panel ${compact ? 'item-card-compact' : ''}`} data-testid={`link-item-${item.id}`}>
      <div className="item-card-image">
        {item.image_url ? (
          <img src={item.image_url} alt="" data-testid={`img-item-${item.id}`} />
        ) : (
          <div className="item-card-placeholder" data-testid={`placeholder-item-${item.id}`}>
            <PackageSearch size={compact ? 22 : 28} strokeWidth={1.5} />
            <span>No photo</span>
          </div>
        )}
        <div className="item-card-image-label">{item.category}</div>
      </div>
      <div className="item-card-copy">
        <div className="item-card-meta">
          <ReportBadge type={item.report_type} />
          <span className="item-card-date" data-testid={`text-created-${item.id}`}>{formatDate(item.created_at)}</span>
        </div>
        <h3 data-testid={`text-item-title-${item.id}`}>{item.title}</h3>
        {!compact && <p>{item.description}</p>}
        <div className="item-card-location">
          <MapPin size={14} />
          <span data-testid={`text-item-location-${item.id}`}>{item.location}</span>
          <ArrowRight size={14} className="item-card-arrow" />
        </div>
      </div>
    </Link>
  );
}

function AppHeader() {
  const [location] = useLocation();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  return (
    <header className="site-header">
      <div className="page-shell header-inner">
        <Link href="/" className="brand" data-testid="link-home">
          <span className="brand-mark"><Compass size={19} strokeWidth={2.2} /></span>
          <span>
            <strong>Found on Campus</strong>
            <small>Smart recovery desk</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/" className={location === '/' ? 'nav-link nav-link-active' : 'nav-link'} data-testid="link-nav-overview">Overview</Link>
          <Link href="/search" className={location === '/search' ? 'nav-link nav-link-active' : 'nav-link'} data-testid="link-nav-browse">Browse reports</Link>
        </nav>
        <div className="header-actions">
          <span className="health-indicator" data-testid="status-network">
            <span className={health.isError ? 'health-dot health-dot-error' : 'health-dot'} />
            <span className="health-label">{health.isError ? 'Network check unavailable' : health.isPending ? 'Checking network' : 'Campus network online'}</span>
          </span>
          <Link href="/report/lost" className="header-report-button" data-testid="link-header-report-lost">
            <span className="header-report-icon">−</span>
            Report lost
          </Link>
        </div>
      </div>
      <div className="mobile-nav page-shell">
        <Link href="/" className={location === '/' ? 'mobile-nav-link mobile-nav-link-active' : 'mobile-nav-link'} data-testid="link-mobile-overview">Overview</Link>
        <Link href="/search" className={location === '/search' ? 'mobile-nav-link mobile-nav-link-active' : 'mobile-nav-link'} data-testid="link-mobile-search">Search reports</Link>
        <Link href="/report/found" className={location === '/report/found' ? 'mobile-nav-link mobile-nav-link-active' : 'mobile-nav-link'} data-testid="link-mobile-found">Report found</Link>
      </div>
    </header>
  );
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-notice state-notice-error" role="alert" data-testid="state-error">
      <CircleAlert size={18} />
      <div><strong>{message}</strong><span>Try again, or come back in a moment.</span></div>
      {onRetry && <button className="button-secondary state-retry" onClick={onRetry} data-testid="button-retry"><RefreshCw size={14} /> Retry</button>}
    </div>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state" data-testid="state-empty">
      <span className="empty-state-icon"><Archive size={22} /></span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

function StatBlock({ label, value, tone, pending }: { label: string; value: number | undefined; tone: string; pending?: boolean }) {
  return (
    <div className={`stat-block ${tone}`} data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}>
      {pending ? <span className="stat-skeleton skeleton" /> : <strong>{value ?? '—'}</strong>}
      <span>{label}</span>
    </div>
  );
}

function Dashboard() {
  const stats = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const recent = useGetRecentItems({ limit: 6 }, { query: { queryKey: getGetRecentItemsQueryKey({ limit: 6 }) } });
  const dashboardStats = stats.data as DashboardStats | undefined;

  return (
    <div className="page-shell page-content">
      <section className="hero-grid stagger-in">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> Campus recovery desk</div>
          <h1>Help it find<br /><em>its way home.</em></h1>
          <p className="hero-lede">A clear, campus-wide place to report missing belongings, post what you found, and let smart matching do the connecting.</p>
          <div className="hero-actions">
            <Link href="/report/lost" className="button-primary" data-testid="link-hero-report-lost">I lost something <ArrowRight size={16} /></Link>
            <Link href="/report/found" className="button-secondary" data-testid="link-hero-report-found">I found something</Link>
          </div>
          <div className="hero-trust"><ShieldCheck size={15} /><span>Built for campus, with contact details only shared through your report.</span></div>
        </div>
        <div className="hero-wayfinding" aria-label="Campus wayfinding illustration">
          <div className="wayfinding-grid" />
          <div className="wayfinding-route route-one" />
          <div className="wayfinding-route route-two" />
          <span className="wayfinding-point point-a">A</span>
          <span className="wayfinding-point point-b">B</span>
          <span className="wayfinding-point point-c">C</span>
          <div className="wayfinding-sign">
            <span className="wayfinding-sign-arrow">→</span>
            <span>REUNITE<br /><small>one report at a time</small></span>
          </div>
          <div className="wayfinding-caption"><Compass size={14} /> The shortest route back is usually a good report.</div>
        </div>
      </section>

      <section className="stats-strip panel stagger-in stagger-1" aria-label="Campus report totals">
        <StatBlock label="Active lost" value={dashboardStats?.active_lost} tone="stat-blue" pending={stats.isPending} />
        <StatBlock label="Active found" value={dashboardStats?.active_found} tone="stat-yellow" pending={stats.isPending} />
        <StatBlock label="Resolved" value={dashboardStats?.resolved} tone="stat-green" pending={stats.isPending} />
        <StatBlock label="Total reports" value={dashboardStats?.total_reports} tone="stat-ink" pending={stats.isPending} />
      </section>
      {stats.isError && <ErrorNotice message="We couldn't load the campus totals." onRetry={() => stats.refetch()} />}

      <section className="section-block stagger-in stagger-2">
        <div className="section-heading">
          <div><div className="eyebrow">Start here</div><h2>Make the next move.</h2></div>
          <span className="section-note">Two minutes can make a big difference.</span>
        </div>
        <div className="entry-grid">
          <Link href="/report/lost" className="entry-card entry-card-lost" data-testid="link-entry-lost">
            <div className="entry-card-icon"><Search size={20} /></div>
            <div><span className="eyebrow">Missing from your route?</span><h3>Report a lost item</h3><p>Give the community the details they need to recognize it.</p></div>
            <ArrowRight size={20} className="entry-arrow" />
          </Link>
          <Link href="/report/found" className="entry-card entry-card-found" data-testid="link-entry-found">
            <div className="entry-card-icon"><HeartHandshake size={20} /></div>
            <div><span className="eyebrow">Picked something up?</span><h3>Report a found item</h3><p>Post it once. We’ll help surface the right lost report.</p></div>
            <ArrowRight size={20} className="entry-arrow" />
          </Link>
        </div>
      </section>

      <section className="section-block stagger-in stagger-3">
        <div className="section-heading">
          <div><div className="eyebrow">Live board</div><h2>Latest reports</h2></div>
          <Link href="/search" className="text-link" data-testid="link-view-all-reports">View all reports <ArrowRight size={15} /></Link>
        </div>
        {recent.isPending ? (
          <div className="item-grid"><div className="item-skeleton skeleton" /><div className="item-skeleton skeleton" /><div className="item-skeleton skeleton" /></div>
        ) : recent.isError ? (
          <ErrorNotice message="Latest reports are taking a little longer to arrive." onRetry={() => recent.refetch()} />
        ) : recent.data?.length ? (
          <div className="item-grid">{recent.data.map((item) => <ItemCard item={item} key={item.id} />)}</div>
        ) : (
          <EmptyState title="The board is clear for now." description="When a report comes in, it will show up here." action={<Link href="/report/lost" className="button-secondary" data-testid="link-empty-create">Add the first report <ArrowRight size={14} /></Link>} />
        )}
      </section>

      <section className="tip-banner stagger-in stagger-4">
        <span className="tip-mark"><Zap size={17} /></span>
        <div><div className="eyebrow">A useful habit</div><strong>Include the last place and time you remember seeing it.</strong><p>Specific details give our matching system a much better starting point.</p></div>
      </section>
    </div>
  );
}

function ReportForm({ reportType }: { reportType: 'lost' | 'found' }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createItem = useCreateItem();
  const [form, setForm] = useState({
    category: categories[0] as string,
    title: '',
    description: '',
    image_url: '',
    location: '',
    event_time: '',
    contact_info: '',
  });
  const [error, setError] = useState('');
  const isLost = reportType === 'lost';

  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (form.title.trim().length < 3) return setError('Add a short title so people can recognize the item.');
    if (form.description.trim().length < 10) return setError('Add a few more details about the item.');
    if (form.location.trim().length < 2) return setError('Add the place where it was lost or found.');
    if (form.contact_info.trim().length < 3) return setError('Add a way for someone to reach you.');
    const payload: ItemInput = { ...form, report_type: reportType, category: form.category as ItemInput['category'] };
    createItem.mutate({ data: payload }, {
      onSuccess: (item) => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
        setLocation(`/item/${item.id}`);
      },
      onError: () => setError('We couldn’t save this report. Check your details and try again.'),
    });
  };

  return (
    <div className="page-shell page-content">
      <div className="form-breadcrumb"><Link href="/" data-testid="link-breadcrumb-home">Overview</Link><ChevronDown size={14} /><span>{isLost ? 'Report lost' : 'Report found'}</span></div>
      <div className="form-layout">
        <section className="form-main">
          <div className="page-intro">
            <div className="eyebrow"><span className="eyebrow-line" /> {isLost ? 'Missing item report' : 'Found item report'}</div>
            <h1>{isLost ? 'Let’s get it<br /><em>back to you.</em>' : 'You found it.<br /><em>Let’s route it home.</em>'}</h1>
            <p>{isLost ? 'Share what you remember. A clear report helps a fellow student recognize your item and gives AI matching the right clues.' : 'A few specific details can turn a found item into someone’s very good day.'}</p>
          </div>
          <form className="report-form panel" onSubmit={submit} data-testid={`form-report-${reportType}`}>
            <div className="form-section">
              <div className="form-section-heading"><span className="form-step">01</span><div><h2>What is it?</h2><p>Start with the details someone would notice first.</p></div></div>
              <div className="form-grid">
                <label className="form-field form-field-wide"><span>Item title <b>*</b></span><input className="field" value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder={isLost ? 'Blue water bottle' : 'Black wireless earbuds'} data-testid="input-item-title" /></label>
                <label className="form-field"><span>Category <b>*</b></span><select className="field" value={form.category} onChange={(event) => updateField('category', event.target.value)} data-testid="select-item-category">{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
                <label className="form-field form-field-wide"><span>Describe it <b>*</b></span><textarea className="field field-textarea" value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Color, brand, identifying marks, what was inside…" rows={5} data-testid="textarea-item-description" /></label>
                <label className="form-field form-field-wide"><span>Photo link <small>optional</small></span><div className="input-with-icon"><ImagePlus size={16} /><input className="field" value={form.image_url} onChange={(event) => updateField('image_url', event.target.value)} placeholder="https://…" data-testid="input-item-image" /></div></label>
              </div>
            </div>
            <div className="form-section">
              <div className="form-section-heading"><span className="form-step">02</span><div><h2>Where and when?</h2><p>Think about the route, building, or last stop.</p></div></div>
              <div className="form-grid">
                <label className="form-field"><span>Location <b>*</b></span><div className="input-with-icon"><MapPin size={16} /><input className="field" value={form.location} onChange={(event) => updateField('location', event.target.value)} placeholder="Library, north entrance" data-testid="input-item-location" /></div></label>
                <label className="form-field"><span>Date and time <small>optional</small></span><div className="input-with-icon"><Clock3 size={16} /><input className="field" type="datetime-local" value={form.event_time} onChange={(event) => updateField('event_time', event.target.value)} data-testid="input-item-time" /></div></label>
              </div>
            </div>
            <div className="form-section">
              <div className="form-section-heading"><span className="form-step">03</span><div><h2>How can we reach you?</h2><p>Only share a contact method you’re comfortable checking.</p></div></div>
              <label className="form-field"><span>Contact details <b>*</b></span><input className="field" value={form.contact_info} onChange={(event) => updateField('contact_info', event.target.value)} placeholder="Email, phone, or campus handle" data-testid="input-item-contact" /></label>
              <div className="privacy-note"><ShieldCheck size={16} /><span>Your contact details are attached to the report so a potential match can reach you.</span></div>
            </div>
            {error && <div className="form-error" role="alert" data-testid="text-form-error"><CircleAlert size={16} />{error}</div>}
            <div className="form-submit-row">
              <Link href="/" className="button-secondary" data-testid="link-cancel-report">Cancel</Link>
              <button className="button-primary" type="submit" disabled={createItem.isPending} data-testid="button-submit-report">
                {createItem.isPending ? <><LoaderCircle size={16} className="spin" /> Saving report…</> : <>Publish report <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>
        </section>
        <aside className="form-aside">
          <div className="preview-card panel">
            <div className="preview-topline"><span className="eyebrow">Live preview</span><span className="preview-signal"><span />Draft</span></div>
            <div className="preview-photo"><PackageSearch size={30} /><span>{form.image_url ? 'Photo link added' : 'Photo optional'}</span></div>
            <ReportBadge type={reportType} />
            <h3>{form.title || 'Your item title'}</h3>
            <p>{form.description || 'Your description will appear here as you write.'}</p>
            <div className="preview-detail"><MapPin size={14} /><span>{form.location || 'Campus location'}</span></div>
            <div className="preview-detail"><Clock3 size={14} /><span>{form.event_time ? formatTime(form.event_time) : 'When it happened'}</span></div>
          </div>
          <div className="aside-callout"><Sparkles size={17} /><strong>Small details make stronger matches.</strong><span>Brand, color, case, sticker, or the building you were near can all help.</span></div>
        </aside>
      </div>
    </div>
  );
}

function SearchPage() {
  const [draft, setDraft] = useState({ search: '', type: '', category: '' });
  const [filters, setFilters] = useState<ListItemsParams>({ limit: 100 });
  const items = useListItems(filters, { query: { queryKey: getListItemsQueryKey(filters) } });
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({ limit: 100, search: draft.search.trim() || undefined, type: draft.type ? draft.type as ListItemsParams['type'] : undefined, category: draft.category ? draft.category as ListItemsParams['category'] : undefined });
  };
  const clearFilters = () => {
    setDraft({ search: '', type: '', category: '' });
    setFilters({ limit: 100 });
  };

  return (
    <div className="page-shell page-content">
      <section className="search-hero stagger-in">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> Campus report board</div>
          <h1>Look a little<br /><em>closer.</em></h1>
          <p>Search active lost and found reports across campus. The right detail might be waiting here.</p>
        </div>
        <div className="search-hero-mark"><PackageSearch size={48} strokeWidth={1.2} /><span data-testid="text-active-report-count">{items.data?.length ?? '—'} active reports</span></div>
      </section>
      <form className="filter-panel panel stagger-in stagger-1" onSubmit={applyFilters} data-testid="form-search-filters">
        <div className="search-input-wrap"><Search size={18} /><input type="search" value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} placeholder="Search by name, color, brand, or place…" data-testid="input-search" /></div>
        <label className="filter-select"><span className="sr-only">Report type</span><Filter size={15} /><select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} data-testid="select-filter-type"><option value="">All reports</option><option value="lost">Lost only</option><option value="found">Found only</option></select><ChevronDown size={14} /></label>
        <label className="filter-select"><span className="sr-only">Category</span><Tag size={15} /><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} data-testid="select-filter-category"><option value="">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select><ChevronDown size={14} /></label>
        <button className="button-primary filter-submit" type="submit" data-testid="button-apply-filters"><Search size={15} /> Search</button>
        {(filters.search || filters.type || filters.category) && <button className="filter-clear" type="button" onClick={clearFilters} data-testid="button-clear-filters"><X size={15} /> Clear</button>}
      </form>
      <section className="section-block search-results-section stagger-in stagger-2">
        <div className="section-heading"><div><div className="eyebrow">Active now</div><h2>{items.isPending ? 'Finding reports…' : `${items.data?.length ?? 0} reports to explore`}</h2></div><span className="section-note">Updated when a new report is posted.</span></div>
        {items.isPending ? (
          <div className="item-grid"><div className="item-skeleton skeleton" /><div className="item-skeleton skeleton" /><div className="item-skeleton skeleton" /></div>
        ) : items.isError ? (
          <ErrorNotice message="The report board couldn’t load." onRetry={() => items.refetch()} />
        ) : items.data?.length ? (
          <div className="item-grid">{items.data.map((item) => <ItemCard item={item} key={item.id} />)}</div>
        ) : (
          <EmptyState title="No reports match that search." description="Try a broader search, another category, or check back soon." action={<button className="button-secondary" onClick={clearFilters} data-testid="button-empty-clear">Clear filters <X size={14} /></button>} />
        )}
      </section>
    </div>
  );
}

function MatchCard({ match }: { match: ItemMatch }) {
  const item = match.matched_item;
  return (
    <Link href={`/item/${item.id}`} className="match-card" data-testid={`link-match-${match.id}`}>
      <div className="match-image">{item.image_url ? <img src={item.image_url} alt="" /> : <PackageSearch size={23} />}</div>
      <div className="match-copy"><div className="match-topline"><span className="match-confidence"><Sparkles size={13} />{Math.round(match.confidence_score)}% match</span><ArrowRight size={15} /></div><h3>{item.title}</h3><p>{match.explanation}</p><span className="match-location"><MapPin size={13} />{item.location}</span></div>
    </Link>
  );
}

function DetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? '';
  const queryClient = useQueryClient();
  const item = useGetItem(id, { query: { enabled: Boolean(id), queryKey: getGetItemQueryKey(id) } });
  const matches = useListItemMatches(id, { query: { enabled: Boolean(id), queryKey: getListItemMatchesQueryKey(id) } });
  const triggerMatch = useTriggerMatch();
  const updateItem = useUpdateItem();
  const [matchMessage, setMatchMessage] = useState('');

  const runMatching = () => {
    setMatchMessage('');
    triggerMatch.mutate({ id }, {
      onSuccess: () => {
        setMatchMessage('Matching is running. Your potential matches will refresh shortly.');
        queryClient.invalidateQueries({ queryKey: getListItemMatchesQueryKey(id) });
      },
      onError: () => setMatchMessage('Matching could not be started. Please try again.'),
    });
  };
  const resolveItem = () => {
    updateItem.mutate({ id, data: { status: 'resolved' } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
      },
    });
  };

  if (item.isPending) return <div className="page-shell page-content"><div className="detail-loading"><div className="detail-loading-photo skeleton" /><div className="detail-loading-lines"><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div></div></div>;
  if (item.isError || !item.data) return <div className="page-shell page-content"><ErrorNotice message="We couldn't find that report." /><Link href="/search" className="button-secondary" data-testid="link-detail-back-search">Back to reports <ArrowRight size={14} /></Link></div>;
  const report = item.data;

  return (
    <div className="page-shell page-content">
      <div className="form-breadcrumb"><Link href="/search" data-testid="link-detail-breadcrumb-search">All reports</Link><ChevronDown size={14} /><span>{report.title}</span></div>
      <section className="detail-layout">
        <div className="detail-main">
          <div className="detail-photo panel">{report.image_url ? <img src={report.image_url} alt={report.title} data-testid="img-detail-item" /> : <div className="detail-photo-empty"><PackageSearch size={45} strokeWidth={1.3} /><span>No photo was added to this report.</span></div>}<div className="detail-photo-badge"><ReportBadge type={report.report_type} /></div></div>
          <div className="detail-heading">
            <div className="detail-heading-top"><StatusBadge status={report.status} /><span className="detail-id">Report {report.id.slice(0, 8)}</span></div>
            <h1 data-testid="text-detail-title">{report.title}</h1>
            <p className="detail-description" data-testid="text-detail-description">{report.description}</p>
          </div>
          <div className="detail-facts panel">
            <div><span className="eyebrow">Category</span><strong data-testid="text-detail-category"><Tag size={15} />{report.category}</strong></div>
            <div><span className="eyebrow">Last known place</span><strong data-testid="text-detail-location"><MapPin size={15} />{report.location}</strong></div>
            <div><span className="eyebrow">When</span><strong data-testid="text-detail-time"><Clock3 size={15} />{formatTime(report.event_time)}</strong></div>
            <div><span className="eyebrow">Posted</span><strong data-testid="text-detail-created"><Archive size={15} />{formatDate(report.created_at)}</strong></div>
          </div>
          <div className="detail-contact panel"><ShieldCheck size={19} /><div><span className="eyebrow">Contact for this report</span><strong data-testid="text-detail-contact">{report.contact_info}</strong><p>Reach out with a detail that confirms it’s yours.</p></div></div>
        </div>
        <aside className="detail-aside">
          <div className="matches-panel panel">
            <div className="matches-heading"><div><span className="eyebrow"><Sparkles size={13} /> Smart matching</span><h2>Potential matches</h2></div><span className="match-count">{matches.data?.length ?? 0}</span></div>
            <p className="matches-intro">We compare descriptions, category, and campus locations to surface promising connections.</p>
            <button className="button-primary match-button" onClick={runMatching} disabled={triggerMatch.isPending} data-testid="button-rerun-matching">{triggerMatch.isPending ? <><LoaderCircle size={15} className="spin" /> Checking…</> : <><RefreshCw size={15} /> Re-run matching</>}</button>
            {matchMessage && <div className="match-message" data-testid="text-match-message"><Sparkles size={14} />{matchMessage}</div>}
            <div className="match-list">
              {matches.isPending ? <><div className="match-skeleton skeleton" /><div className="match-skeleton skeleton" /></> : matches.isError ? <ErrorNotice message="Potential matches are unavailable." onRetry={() => matches.refetch()} /> : matches.data?.length ? matches.data.map((match) => <MatchCard match={match} key={match.id} />) : <div className="match-empty"><Sparkles size={22} /><strong>No strong matches yet.</strong><span>Try adding a photo or a more specific detail to your report.</span></div>}
            </div>
          </div>
          {report.status === 'active' ? <div className="resolve-panel panel"><div><BadgeCheck size={18} /><strong>Got your item back?</strong><span>Close the loop so everyone knows it’s been reunited.</span></div><button className="button-secondary" onClick={resolveItem} disabled={updateItem.isPending} data-testid="button-mark-resolved">{updateItem.isPending ? <LoaderCircle size={14} className="spin" /> : <Check size={14} />} Mark resolved</button></div> : <div className="resolved-panel panel"><BadgeCheck size={19} /><div><strong>This report is resolved.</strong><span>Thanks for helping keep the campus board current.</span></div></div>}
        </aside>
      </section>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <AppHeader />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/report/lost"><ReportForm reportType="lost" /></Route>
        <Route path="/report/found"><ReportForm reportType="found" /></Route>
        <Route path="/search" component={SearchPage} />
        <Route path="/item/:id" component={DetailPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;