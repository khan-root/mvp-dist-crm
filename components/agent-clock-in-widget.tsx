"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, LogOut, Timer, ShieldCheck, Layers, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toastApiError } from "@/lib/utils";

interface AgentClockInWidgetProps {
  agentId: string;
}

export function AgentClockInWidget({ agentId }: AgentClockInWidgetProps) {
  const [dataPayload, setDataPayload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState<string>("00h 00m 00s");

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hr/attendance/clock-in?agent_id=${agentId}`);
      const result = await res.json();
      if (result.success) {
        setDataPayload(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, [agentId]);

  const activeShift = dataPayload?.activeRecord || null;
  const latestShift = dataPayload?.latestRecord || null;
  const shiftCount = dataPayload?.total_shifts_today || 0;

  // Timer ticker for active live shift duration
  useEffect(() => {
    if (!activeShift || !activeShift.clock_in) return;

    const interval = setInterval(() => {
      const start = new Date(activeShift.clock_in).getTime();
      const now = new Date().getTime();
      const diffMs = Math.max(0, now - start);

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setElapsed(
        `${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeShift]);

  const handleClockAction = async (action: "clock_in" | "clock_out") => {
    setSubmitting(true);
    toast.info(`Obtaining GPS location for shift ${action === "clock_in" ? "clock-in" : "clock-out"}...`);

    if (!navigator.geolocation) {
      submitWithLocation(action, 34.0151, 71.5249, "Peshawar Market Central");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
        await submitWithLocation(action, latitude, longitude, address);
      },
      async (err) => {
        toast.error(`GPS Warning: ${err.message}. Using default location.`);
        await submitWithLocation(action, 34.0151, 71.5249, "Peshawar Market Central");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const submitWithLocation = async (action: string, latitude: number, longitude: number, address: string) => {
    try {
      const res = await fetch("/api/hr/attendance/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          action,
          latitude,
          longitude,
          address,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        fetchTodayAttendance();
      } else {
        toast.error(result.error || "Shift update failed");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-800 bg-slate-950 text-white animate-pulse p-4">
        <div className="h-12 bg-slate-900 rounded-lg"></div>
      </Card>
    );
  }

  const isClockedIn = Boolean(activeShift);
  const isShift1Completed = shiftCount > 0 && !activeShift;

  return (
    <Card className="border-slate-800 bg-slate-950 text-white shadow-xl overflow-hidden relative">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-center shadow-lg ${
              isClockedIn
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 animate-pulse"
                : isShift1Completed
                ? "bg-sky-500/20 border border-sky-500/30 text-sky-400"
                : "bg-emerald-600 text-white"
            }`}
          >
            <Clock className="size-6" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold tracking-wide text-slate-300 uppercase">Field Roster & Shift</span>
              {activeShift && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> {activeShift.shift_name || `Shift #${activeShift.shift_number}`} Active
                </Badge>
              )}
              {isShift1Completed && (
                <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-[11px] font-mono">
                  {shiftCount} Shift(s) Logged Today
                </Badge>
              )}
              {activeShift?.status === "late" && !activeShift?.is_compensated && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[11px]">
                  Late Arrival ({activeShift.late_minutes}m)
                </Badge>
              )}
              {activeShift?.is_compensated && (
                <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 gap-1 text-[11px]">
                  <ShieldCheck className="size-3" /> Evening Compensated
                </Badge>
              )}
            </div>

            {isClockedIn ? (
              <div className="flex items-baseline gap-3">
                <div className="text-2xl font-black font-mono tracking-tight text-emerald-400">{elapsed}</div>
                <span className="text-xs text-slate-400 font-mono">
                  Clocked In: {new Date(activeShift.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ) : isShift1Completed ? (
              <div className="text-xs text-slate-300 space-y-0.5 font-mono">
                <p>
                  Latest Shift: <span className="font-bold text-emerald-400">{latestShift?.total_hours_worked || 0} hrs</span> (Clocked out at{" "}
                  {latestShift?.clock_out ? new Date(latestShift.clock_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Done"})
                </p>
                <p className="text-slate-400 text-[11px]">Ready to start Shift #{shiftCount + 1} (Double Shift Roster)</p>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-bold text-white">Shift #1 Not Started</h3>
                <p className="text-xs text-slate-400">Assigned Shift Policy Hours (Supports Multi-Shift Rosters)</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {!isClockedIn && (
            <Button
              disabled={submitting}
              onClick={() => handleClockAction("clock_in")}
              className={`w-full md:w-auto font-bold px-6 py-5 rounded-xl shadow-lg gap-2 cursor-pointer transition-all ${
                isShift1Completed
                  ? "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Processing...
                </>
              ) : isShift1Completed ? (
                <>
                  <Plus className="size-4" /> Clock-In Shift #{shiftCount + 1} (Roster)
                </>
              ) : (
                <>
                  <Timer className="size-4" /> Clock-In Shift #1
                </>
              )}
            </Button>
          )}

          {isClockedIn && (
            <Button
              disabled={submitting}
              onClick={() => handleClockAction("clock_out")}
              className="w-full md:w-auto bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-5 rounded-xl shadow-lg shadow-amber-600/20 gap-2 cursor-pointer transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Clocking Out...
                </>
              ) : (
                <>
                  <LogOut className="size-4" /> Clock-Out Shift #{activeShift.shift_number}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
