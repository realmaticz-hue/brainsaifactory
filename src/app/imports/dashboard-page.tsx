// app/page.tsx

"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Confetti from "react-confetti"

/* ============================================================
   TYPES
============================================================ */

interface Deployment {
  id: string
  url: string
  status: "building" | "ready" | "error"
}

/* ============================================================
   DASHBOARD PAGE
============================================================ */

export default function HomePage() {
  const router = useRouter();

  /* ---------------- STATE ---------------- */
  const [deployHistory, setDeployHistory] = useState<Deployment[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "building" | "ready" | "error"
  >("all");
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  /* ---------------- FETCH DEPLOYMENTS ---------------- */
  const fetchDeployments = async (): Promise<Deployment[]> => {
    try {
      const res = await fetch("/api/deploy/vercel");
      if (!res.ok) throw new Error("Failed to fetch deployments");
      const data: { deployments: Deployment[] } = await res.json();
      return data.deployments ?? [];
    } catch (err) {
      console.error("Error fetching deployments:", err);
      return [];
    }
  }

  /* ---------------- REFRESH HISTORY & CELEBRATION ---------------- */
  const refreshDeployments = async () => {
    const data = await fetchDeployments();
    setDeployHistory((prev) => {
      const latest = data[0];
      const prevLatest = prev[0];
      if (latest?.status === "ready" && latest.id !== prevLatest?.id) {
        setCelebratingId(latest.id);
        setTimeout(() => setCelebratingId(null), 4000);
      }
      return data;
    });

    // Initialize progress for building deployments
    const newProgress: Record<string, number> = {};
    data.forEach((d) => {
      if (d.status === "building") newProgress[d.id] = progressMap[d.id] ?? 0;
    });
    setProgressMap(newProgress);
  }

  /* ---------------- AUTO REFRESH ---------------- */
  useEffect(() => {
    refreshDeployments();
    const interval = setInterval(refreshDeployments, 8000);
    return () => clearInterval(interval);
  }, [])

  /* ---------------- PROGRESS ANIMATION ---------------- */
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    deployHistory.forEach((d) => {
      if (d.status === "building") {
        const timer = setInterval(() => {
          setProgressMap((prev) => {
            const current = prev[d.id] ?? 0;
            if (current >= 100 || d.status !== "building") {
              clearInterval(timer);
              return { ...prev, [d.id]: 100 };
            }
            return { ...prev, [d.id]: current + 1 };
          });
        }, 100);
        timers.push(timer);
      }
    });

    return () => timers.forEach(clearInterval);
  }, [deployHistory])

  /* ---------------- FILTERED DEPLOYMENTS ---------------- */
  const filteredDeployments = useMemo(() => {
    return statusFilter === "all"
      ? deployHistory
      : deployHistory.filter((d) => d.status === statusFilter);
  }, [deployHistory, statusFilter])

  /* ============================================================
     LIVE LOGS COMPONENT
  ============================================================ */
  const LiveLogs = ({ deploymentId }: { deploymentId: string }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const evtSource = new EventSource(
        `/api/deploy/vercel/stream?id=${deploymentId}`
      );
      evtSource.onmessage = (e) => {
        setLogs((prev) => [...prev, e.data]);
        if (containerRef.current)
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
      evtSource.onerror = () => evtSource.close();
      return () => evtSource.close();
    }, [deploymentId])

    const downloadLogs = () => {
      const text = logs.join("\n");
      const blob = new Blob([text], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `deployment-${deploymentId}-logs.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    }

    return (
      <div className="mt-2 bg-gray-900 p-2 rounded text-xs font-mono relative">
        <button
          onClick={downloadLogs}
          className="absolute top-1 right-1 px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-[10px] z-10"
        >
          Download Logs
        </button>

        <div ref={containerRef} className="max-h-40 overflow-y-auto pt-6">
          {logs.map((line, idx) => (
            <div key={idx} className="text-gray-300 break-all">
              {line}
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-6">
      {/* CONFETTI */}
      {celebratingId && (
        <Confetti
          numberOfPieces={150}
          recycle={false}
          gravity={0.2}
          colors={["#10B981", "#FBBF24", "#3B82F6"]}
        />
      )}

      <h1 className="text-5xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-400 mb-6">
        Access your projects, recent builds, and exports.
      </p>

      <button
        onClick={() => router.push("/builder")}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-semibold transition mb-6"
      >
        Open Builder
      </button>

      {deployHistory.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-xl w-full max-w-3xl mt-6">
          {/* HEADER & FILTER */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Deployment History (Live)</h2>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "building" | "ready" | "error")
                }
                className="bg-gray-700 text-white rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="building">Building</option>
                <option value="ready">Ready</option>
                <option value="error">Error</option>
              </select>

              <button
                onClick={refreshDeployments}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* DEPLOYMENTS LIST */}
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {filteredDeployments.map((d, idx) => {
                const isLatest = idx === 0;
                let badgeColor = "text-yellow-400";
                let badgeEmoji = "🟡";
                if (d.status === "ready") {
                  badgeColor = "text-green-400";
                  badgeEmoji = "🟢";
                } else if (d.status === "error") {
                  badgeColor = "text-red-500";
                  badgeEmoji = "🔴";
                }

                return (
                  <motion.div
                    key={d.id || idx}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      boxShadow:
                        d.status === "building"
                          ? "0 0 10px 2px rgba(250, 204, 21, 0.6)"
                          : "0 0 0 rgba(0,0,0,0)",
                    }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{
                      duration: 0.6,
                      repeat: d.status === "building" ? Infinity : 0,
                      repeatType: "mirror",
                    }}
                    className={`flex flex-col bg-gray-700 p-3 rounded-lg ${
                      isLatest ? "border-2 border-yellow-400" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="break-all">{d.url}</span>
                      <span className={`ml-4 text-sm font-semibold ${badgeColor}`}>
                        {badgeEmoji} {d.status}
                        {isLatest && (
                          <span className="ml-1 font-bold">Latest</span>
                        )}
                      </span>
                    </div>

                    {d.status === "building" && (
                      <div className="h-2 bg-gray-600 rounded-full mt-2">
                        <motion.div
                          className="h-2 bg-yellow-400 rounded-full"
                          style={{ width: `${progressMap[d.id] || 0}%` }}
                          animate={{ width: `${progressMap[d.id] || 0}%` }}
                          transition={{ ease: "linear", duration: 0.1 }}
                        />
                      </div>
                    )}

                    {d.status === "building" && (
                      <LiveLogs deploymentId={d.id} />
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
