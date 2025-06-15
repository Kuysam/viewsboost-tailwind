import React, { useState, useEffect, useRef } from "react";
import {
  getAllShorts,
  toggleShortLike,
  listenShortLikes,
  addShortComment,
  listenShortComments,
} from "../lib/services/shortsService";
import { auth } from "../lib/firebase";
import YouTube from "react-youtube";
import { motion, AnimatePresence } from "framer-motion";

function Shorts() {
  const [shorts, setShorts] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false); // UI only, not persisted
  const [heartBurst, setHeartBurst] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [direction, setDirection] = useState(0); // -1 for up, 1 for down
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);

  useEffect(() => {
    getAllShorts().then(setShorts);
  }, []);

  useEffect(() => {
    if (shorts.length && shorts[index]) {
      const video = shorts[index];
      const unsub = listenShortLikes(video.id, (count, likedByMe) => {
        setLikesCount(count);
        setLiked(likedByMe);
      });
      setDisliked(false);
      return () => unsub();
    }
  }, [shorts, index]);

  useEffect(() => {
    if (showComments && shorts.length && shorts[index]) {
      const video = shorts[index];
      const unsub = listenShortComments(video.id, setComments);
      return () => unsub();
    }
  }, [showComments, shorts, index]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") nextShort();
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") prevShort();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shorts, index]);

  // Swipe gesture (handle on the OUTERMOST container for full-screen gesture)
  function onTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dy = e.changedTouches[0].clientY - startYRef.current;
    if (dy < -40) nextShort();
    if (dy > 40) prevShort();
  }
  function onWheel(e: React.WheelEvent) {
    if (e.deltaY > 10) nextShort();
    if (e.deltaY < -10) prevShort();
  }

  function nextShort() {
    if (index < shorts.length - 1) {
      setDirection(1);
      setIndex((i) => i + 1);
    }
  }
  function prevShort() {
    if (index > 0) {
      setDirection(-1);
      setIndex((i) => i - 1);
    }
  }

  function onLike() {
    toggleShortLike(shorts[index].id);
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 420);
  }

  function onDislike() {
    setDisliked((prev) => !prev);
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addShortComment(shorts[index].id, newComment.trim());
    setNewComment("");
  }
  function toggleMute() {
    setIsMuted((m) => !m);
  }
  function onShare() {
    const video = shorts[index];
    const url = `https://www.youtube.com/shorts/${video.id}`;
    if (navigator.share) {
      navigator.share({ title: video.title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  }

  // --- UI ---
  if (!shorts.length) {
    return (
      <div className="w-full min-h-[80vh] flex flex-col items-center justify-center text-gray-300 text-xl">
        <span>No Shorts found.</span>
        <span className="text-sm opacity-70">
          (Check ingestion and Firestore 'type' field)
        </span>
      </div>
    );
  }

  // Animation variants for framer-motion
  const variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 420 : -420,
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      y: direction < 0 ? 420 : -420,
      opacity: 0,
    }),
  };
  const video = shorts[index];

  return (
    <div
      className="w-full min-h-screen h-full flex flex-col items-center bg-black pb-4"
      style={{
        minHeight: "100vh",
        overflow: "hidden",
        touchAction: "pan-y",
      }}
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
    >
      <div className="text-4xl font-bold text-white text-center pt-6 pb-3 tracking-tight">
        Shorts
      </div>
      <div
        className="flex-1 flex flex-col justify-center items-center"
        style={{
          width: "100vw",
          minHeight: "calc(100vh - 60px)",
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible",
        }}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={video.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              y: { type: "spring", stiffness: 500, damping: 40 },
              opacity: { duration: 0.2 },
            }}
            style={{
              width: 540,
              height: 920,
              maxWidth: "100vw",
              maxHeight: "calc(100vh - 60px)",
              position: "relative",
              background: "#111",
              borderRadius: 26,
              overflow: "hidden",
              boxShadow: "0 0 40px 10px #000c",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 auto",
            }}
          >
            <div className="relative w-full h-full flex justify-center items-center">
              {/* --- MAIN VIDEO LAYER --- */}
              <YouTube
                videoId={video.id}
                opts={{
                  height: "920",
                  width: "540",
                  playerVars: {
                    autoplay: 1,
                    mute: isMuted ? 1 : 0,
                    controls: 0,
                    modestbranding: 1,
                    loop: 1,
                    playlist: video.id,
                    rel: 0,
                    fs: 0,
                    disablekb: 1,
                    iv_load_policy: 3,
                  },
                }}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* --- RIGHT SIDE ACTION BAR --- */}
              <div
                className="absolute flex flex-col items-center justify-center gap-8"
                style={{
                  right: 24,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 40,
                }}
              >
                {/* Like */}
                <button
                  className="group"
                  onClick={onLike}
                  style={{ outline: "none" }}
                >
                  <span
                    className={`transition-all duration-300 block mx-auto ${
                      heartBurst ? "scale-150 animate-bounce" : "scale-100"
                    }`}
                    style={{
                      filter: liked
                        ? "drop-shadow(0 0 20px #f01c80dd)"
                        : "drop-shadow(0 0 8px #fff6)",
                      color: liked ? "#f01c80" : "#eee",
                      fontSize: 34,
                      transition: "color 0.18s, filter 0.18s",
                    }}
                  >
                    {liked ? "❤️" : "🤍"}
                  </span>
                  <span
                    className="block text-white font-bold text-base text-center drop-shadow"
                    style={{ marginTop: -3 }}
                  >
                    {likesCount}
                  </span>
                </button>
                {/* Dislike */}
                <button
                  className="group"
                  onClick={onDislike}
                  style={{ outline: "none" }}
                >
                  <span
                    className={`transition-all duration-300 block mx-auto`}
                    style={{
                      color: disliked ? "#38bdf8" : "#eee",
                      fontSize: 28,
                    }}
                  >
                    {disliked ? "👎🏻" : "👎"}
                  </span>
                </button>
                {/* Comments */}
                <button
                  className="group"
                  onClick={() => setShowComments(true)}
                  style={{ outline: "none" }}
                >
                  <span
                    className="transition-all duration-200 block mx-auto"
                    style={{ color: "#fff", fontSize: 32 }}
                  >
                    💬
                  </span>
                  <span
                    className="block text-white font-bold text-base text-center drop-shadow"
                    style={{ marginTop: -2 }}
                  >
                    {comments.length || " "}
                  </span>
                </button>
                {/* Share */}
                <button
                  className="group"
                  onClick={onShare}
                  style={{ outline: "none" }}
                >
                  <span
                    className="transition-all duration-200 block mx-auto"
                    style={{ color: "#fff", fontSize: 28 }}
                  >
                    🔗
                  </span>
                </button>
              </div>
              {/* Mute/Unmute */}
              <button
                className="absolute top-3 right-3 z-50 bg-black/60 rounded-full p-2 hover:bg-black/80 transition"
                onClick={toggleMute}
                style={{ pointerEvents: "auto" }}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
            </div>
            {/* Video Info */}
            <div className="w-full px-4 absolute bottom-4 left-0">
              <div className="text-lg font-bold text-white truncate mb-1">
                {video.title}
              </div>
              <div className="text-gray-300 text-xs">
                Duration: {Math.floor((video.duration || 0) / 60)} min{" "}
                {((video.duration || 0) % 60)}s
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-40 flex flex-col items-center justify-end pt-20">
          <div className="w-full max-w-md bg-white rounded-t-2xl shadow-2xl px-4 pt-4 pb-6 max-h-[72vh] overflow-auto">
            <button
              className="absolute top-4 right-6 text-2xl"
              onClick={() => setShowComments(false)}
            >
              ✕
            </button>
            <div className="text-xl font-bold mb-2 text-center text-pink-700">
              Comments
            </div>
            <form onSubmit={postComment} className="flex gap-2 mb-2">
              <input
                className="flex-1 border rounded px-3 py-2"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={160}
                disabled={!auth.currentUser}
              />
              <button
                className="bg-pink-600 text-white rounded px-4 py-2 font-bold"
                type="submit"
                disabled={!auth.currentUser || !newComment.trim()}
              >
                Post
              </button>
            </form>
            <div className="divide-y divide-gray-200">
              {comments.length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  No comments yet.
                </div>
              )}
              {comments.map((c, i) => (
                <div key={c.id || i} className="py-2 px-1">
                  <div
                    className="font-bold text-gray-900 mb-1"
                    style={{ fontSize: 14 }}
                  >
                    {c.userId?.slice(0, 10) || "User"}{" "}
                    <span className="text-gray-400 text-xs">
                      {c.createdAt?.toDate?.().toLocaleString?.() || ""}
                    </span>
                  </div>
                  <div className="text-gray-800" style={{ fontSize: 15 }}>
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shorts;
