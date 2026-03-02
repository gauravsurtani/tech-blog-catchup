"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Trash2,
  ArrowLeft,
  Music,
  Loader2,
  X,
} from "lucide-react";
import { getPost } from "@/lib/api";
import type { Post, PostDetail } from "@/lib/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { usePlaylists } from "@/hooks/usePlaylists";
import PostListItem from "@/components/PostListItem";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const { play, addToQueue, currentTrack, queue } = useAudioPlayer();
  const { getPlaylistById, removeFromPlaylist, deletePlaylist } = usePlaylists();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const playlist = getPlaylistById(playlistId);

  const fetchPosts = useCallback(async () => {
    if (!playlist || playlist.postIds.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(
        playlist.postIds.map((postId: number) => getPost(postId).catch(() => null))
      );
      const filtered = results.filter((p: PostDetail | null): p is PostDetail => p !== null);
      setPosts(filtered);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [playlist]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePlayAll = () => {
    const ready = posts.filter((p: Post) => p.audio_status === "ready");
    if (ready.length === 0) return;
    play(ready[0]);
    ready.slice(1).forEach((p: Post) => addToQueue(p));
  };

  const handleRemove = (postId: number) => {
    removeFromPlaylist(playlistId, postId);
    setPosts((prev: Post[]) => prev.filter((p: Post) => p.id !== postId));
  };

  const handleDelete = () => {
    deletePlaylist(playlistId);
    router.push("/playlist");
  };

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--text-2)] text-lg mb-4">Playlist not found</p>
        <Link
          href="/playlist"
          className="text-sm text-[var(--text-3)] hover:text-[var(--text-1)] underline"
        >
          Back to playlists
        </Link>
      </div>
    );
  }

  const readyCount = posts.filter((p: Post) => p.audio_status === "ready").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/playlist"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-3)] hover:text-[var(--text-1)] mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          All Playlists
        </Link>

        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-[var(--radius)] flex items-center justify-center text-[var(--primary-text)] text-xl font-bold shrink-0"
                style={{ backgroundColor: playlist.color }}
              >
                {playlist.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-1)]">
                  {playlist.name}
                </h1>
                {playlist.description && (
                  <p className="text-sm text-[var(--text-3)] mt-0.5">
                    {playlist.description}
                  </p>
                )}
                <p className="text-xs text-[var(--text-3)] mt-1">
                  {playlist.postIds.length} {playlist.postIds.length === 1 ? "post" : "posts"}
                  {readyCount > 0 && ` · ${readyCount} with audio`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {readyCount > 0 && (
                <button
                  onClick={handlePlayAll}
                  className="nb-hover inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] font-medium rounded-[var(--radius-full)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-colors"
                >
                  <Play size={18} />
                  Play All
                </button>
              )}
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--error)]">Delete?</span>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 bg-[var(--error)] hover:opacity-90 text-[var(--primary-text)] text-sm rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)] transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 bg-[var(--tag-bg)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] text-sm rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)] transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 text-[var(--text-3)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] rounded-[var(--radius)] transition-colors"
                  title="Delete playlist"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="text-[var(--text-3)] animate-spin mb-3" />
          <p className="text-[var(--text-3)]">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Music size={48} className="text-[var(--text-3)] mb-4 opacity-50" />
          <p className="text-[var(--text-2)] text-lg mb-1">No posts yet</p>
          <p className="text-[var(--text-3)] text-sm">
            Add posts from the Explore page or audio queue.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {posts.map((post: Post) => (
            <div key={post.id} className="flex items-center border-b-[1.5px] border-[var(--split)]">
              <div className="flex-1 min-w-0">
                <PostListItem
                  post={post}
                  onPlay={() => play(post)}
                  onAddToQueue={() => {
                    if (!queue.some((q: Post) => q.id === post.id)) addToQueue(post);
                  }}
                  isPlaying={currentTrack?.id === post.id}
                  isQueued={queue.some((q: Post) => q.id === post.id)}
                />
              </div>
              <button
                onClick={() => handleRemove(post.id)}
                className="shrink-0 p-2 mr-2 text-[var(--text-3)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] rounded-[var(--radius)] transition-colors"
                title="Remove from playlist"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
