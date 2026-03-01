"use client";

import { useState, useEffect } from "react";
import { getPosts, getSources } from "@/lib/api";
import type { Post, Source } from "@/lib/types";
import Carousel from "@/components/Carousel";
import CarouselCard from "@/components/CarouselCard";

interface SectionData {
  recentlyAdded: Post[];
  popularBySource: { sourceKey: string; sourceName: string; posts: Post[] }[];
  quickListens: Post[];
  loading: boolean;
}

function CardSkeleton() {
  return (
    <div className="flex-shrink-0 w-48 sm:w-56 snap-start bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2.5 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 bg-gray-800 rounded-full" />
        <div className="h-3 w-16 bg-gray-800 rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="h-4 w-full bg-gray-800 rounded" />
        <div className="h-4 w-2/3 bg-gray-800 rounded" />
      </div>
      <div className="mt-auto flex items-center justify-between">
        <div className="h-3 w-12 bg-gray-800 rounded" />
        <div className="h-3 w-10 bg-gray-800 rounded" />
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-40 bg-gray-800 rounded animate-pulse" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

const QUICK_LISTEN_MAX_SECS = 600;

export default function HomeSections() {
  const [data, setData] = useState<SectionData>({
    recentlyAdded: [],
    popularBySource: [],
    quickListens: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchSections() {
      try {
        const [recentResult, sourcesResult] = await Promise.all([
          getPosts({ sort: "newest", limit: 20, audio_status: "ready" }),
          getSources(),
        ]);

        if (cancelled) return;

        const recentlyAdded = recentResult.posts.slice(0, 10);

        const quickListens = recentResult.posts.filter(
          (p) =>
            p.audio_duration_secs !== null &&
            p.audio_duration_secs > 0 &&
            p.audio_duration_secs < QUICK_LISTEN_MAX_SECS,
        );

        const topSources = sourcesResult
          .sort((a: Source, b: Source) => b.post_count - a.post_count)
          .slice(0, 3);

        const sourceResults = await Promise.all(
          topSources.map(async (source: Source) => {
            const result = await getPosts({
              source: source.key,
              audio_status: "ready",
              sort: "newest",
              limit: 5,
            });
            return {
              sourceKey: source.key,
              sourceName: source.name,
              posts: result.posts,
            };
          }),
        );

        if (cancelled) return;

        const popularBySource = sourceResults.filter(
          (s) => s.posts.length > 0,
        );

        setData({
          recentlyAdded,
          popularBySource,
          quickListens,
          loading: false,
        });
      } catch {
        if (!cancelled) {
          setData((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    fetchSections();
    return () => {
      cancelled = true;
    };
  }, []);

  if (data.loading) {
    return (
      <div className="space-y-10">
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  const hasAnySections =
    data.recentlyAdded.length > 0 ||
    data.popularBySource.length > 0 ||
    data.quickListens.length > 0;

  if (!hasAnySections) return null;

  return (
    <div className="space-y-10">
      {data.recentlyAdded.length > 0 && (
        <Carousel
          title="Recently Added"
          seeAllHref="/explore?audio_status=ready&sort=newest"
        >
          {data.recentlyAdded.map((post) => (
            <CarouselCard key={post.id} post={post} />
          ))}
        </Carousel>
      )}

      {data.popularBySource.map((section) => (
        <Carousel
          key={section.sourceName}
          title={section.sourceName}
          seeAllHref={`/explore?source=${encodeURIComponent(section.sourceKey)}`}
        >
          {section.posts.map((post) => (
            <CarouselCard key={post.id} post={post} />
          ))}
        </Carousel>
      ))}

      {data.quickListens.length > 0 && (
        <Carousel
          title="Quick Listens"
          seeAllHref="/explore?audio_status=ready&sort=newest"
        >
          {data.quickListens.map((post) => (
            <CarouselCard key={post.id} post={post} />
          ))}
        </Carousel>
      )}
    </div>
  );
}
