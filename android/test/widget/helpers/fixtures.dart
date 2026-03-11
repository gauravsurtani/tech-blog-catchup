import 'package:tech_blog_catchup/models/crawl_status.dart';
import 'package:tech_blog_catchup/models/job.dart';
import 'package:tech_blog_catchup/models/paginated_posts.dart';
import 'package:tech_blog_catchup/models/post.dart';
import 'package:tech_blog_catchup/models/source.dart';
import 'package:tech_blog_catchup/models/status_info.dart';
import 'package:tech_blog_catchup/models/tag.dart';

// ── Posts ──────────────────────────────────────────────

final readyPosts = [
  const Post(
    id: 1,
    url: 'https://eng.uber.com/post-1',
    sourceKey: 'uber',
    sourceName: 'Uber Engineering',
    title: 'Building Scalable ML Pipelines',
    summary: 'How we scaled our ML infrastructure.',
    author: 'Jane Doe',
    audioStatus: 'ready',
    audioPath: 'audio/post_1.mp3',
    audioDurationSecs: 320,
    wordCount: 1500,
  ),
  const Post(
    id: 2,
    url: 'https://engineering.meta.com/post-2',
    sourceKey: 'meta',
    sourceName: 'Meta Engineering',
    title: 'React Server Components Deep Dive',
    summary: 'Understanding RSC from the inside.',
    audioStatus: 'ready',
    audioPath: 'audio/post_2.mp3',
    audioDurationSecs: 450,
    wordCount: 2200,
  ),
  const Post(
    id: 3,
    url: 'https://blog.cloudflare.com/post-3',
    sourceKey: 'cloudflare',
    sourceName: 'Cloudflare Blog',
    title: 'Edge Computing Best Practices',
    audioStatus: 'ready',
    audioPath: 'audio/post_3.mp3',
    audioDurationSecs: 280,
    wordCount: 1200,
  ),
];

const pendingCount = 5;

final explorePosts = [
  ...readyPosts,
  const Post(
    id: 4,
    url: 'https://eng.uber.com/post-4',
    sourceKey: 'uber',
    sourceName: 'Uber Engineering',
    title: 'Real-time Feature Store',
    audioStatus: 'pending',
    wordCount: 1800,
  ),
  const Post(
    id: 5,
    url: 'https://engineering.meta.com/post-5',
    sourceKey: 'meta',
    sourceName: 'Meta Engineering',
    title: 'Large Language Model Infrastructure',
    audioStatus: 'failed',
    wordCount: 3000,
  ),
];

const postDetail = PostDetail(
  id: 1,
  url: 'https://eng.uber.com/post-1',
  sourceKey: 'uber',
  sourceName: 'Uber Engineering',
  title: 'Building Scalable ML Pipelines',
  summary: 'How we scaled our ML infrastructure.',
  author: 'Jane Doe',
  audioStatus: 'ready',
  audioPath: 'audio/post_1.mp3',
  audioDurationSecs: 320,
  wordCount: 1500,
  fullText: '# Building Scalable ML Pipelines\n\nThis is the full content.',
  qualityScore: 85,
  extractionMethod: 'trafilatura',
);

const pendingPostDetail = PostDetail(
  id: 4,
  url: 'https://eng.uber.com/post-4',
  sourceKey: 'uber',
  sourceName: 'Uber Engineering',
  title: 'Real-time Feature Store',
  audioStatus: 'pending',
  wordCount: 1800,
  fullText: '# Real-time Feature Store\n\nContent here.',
  qualityScore: 72,
  extractionMethod: 'trafilatura',
);

// ── Tags & Sources ────────────────────────────────────

const testTags = [
  Tag(name: 'Machine Learning', slug: 'ml', postCount: 8),
  Tag(name: 'Frontend', slug: 'frontend', postCount: 5),
];

const testSources = [
  Source(key: 'uber', name: 'Uber Engineering', postCount: 10),
  Source(key: 'meta', name: 'Meta Engineering', postCount: 8),
];

// ── Status ────────────────────────────────────────────

const testStatusInfo = StatusInfo(
  totalPosts: 25,
  postsBySource: testSources,
  audioCounts: {'ready': 13, 'pending': 10, 'processing': 1, 'failed': 1},
  tagCounts: testTags,
);

final testCrawlStatus = [
  CrawlStatusItem(
    sourceKey: 'uber',
    sourceName: 'Uber Engineering',
    enabled: true,
    feedUrl: 'https://eng.uber.com/feed/',
    blogUrl: 'https://eng.uber.com/',
    status: 'success',
    postCount: 10,
    totalDiscoverable: 530,
    lastCrawlAt: DateTime(2026, 2, 19),
    lastCrawlType: 'smart',
    postsAddedLast: 3,
    urlsFoundLast: 12,
  ),
  const CrawlStatusItem(
    sourceKey: 'meta',
    sourceName: 'Meta Engineering',
    enabled: true,
    feedUrl: 'https://engineering.fb.com/feed/',
    status: 'success',
    postCount: 8,
    totalDiscoverable: 1075,
  ),
];

// ── Jobs ──────────────────────────────────────────────

final runningJob = Job(
  id: 1,
  jobType: 'generate',
  status: 'running',
  createdAt: DateTime(2026, 2, 20, 10, 0),
  startedAt: DateTime(2026, 2, 20, 10, 0, 5),
);

final completedJob = Job(
  id: 1,
  jobType: 'generate',
  status: 'completed',
  createdAt: DateTime(2026, 2, 20, 10, 0),
  startedAt: DateTime(2026, 2, 20, 10, 0, 5),
  completedAt: DateTime(2026, 2, 20, 10, 2, 30),
);

// ── Helpers ───────────────────────────────────────────

PaginatedPosts paginatedReady({int total = 3}) => PaginatedPosts(
      posts: readyPosts,
      total: total,
      offset: 0,
      limit: 12,
    );

PaginatedPosts paginatedExplore({int total = 5}) => PaginatedPosts(
      posts: explorePosts,
      total: total,
      offset: 0,
      limit: 20,
    );

PaginatedPosts paginatedPending({int total = 5}) => const PaginatedPosts(
      posts: [],
      total: 5,
      offset: 0,
      limit: 1,
    );
