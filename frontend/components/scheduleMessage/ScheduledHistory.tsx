import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import ContactsPagination from "../contacts/ContactsPagination";

interface ScheduledJob {
  _id: string;
  campaignId: string;
  group?: string;
  message: string;
  scheduledAt: string;
  status?: string;
  sentCount: number;
  failedCount: number;
  totalContacts: number;
}

interface Props {
  refreshTrigger?: number;
}

export default function ScheduledHistory({ refreshTrigger }: Props) {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchJobs = () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${apiBase}/scheduled-messages?page=${currentPage}&limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        setJobs(Array.isArray(data?.data) ? data.data : []);
        setTotal(data?.total || 0);
      })
      .catch(() => {
        setJobs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();

    socket.on("campaign-progress", (update: any) => {
      setJobs((prev) => 
        prev.map((job) => 
          job._id === update.campaignId 
            ? { 
                ...job, 
                status: update.status, 
                sentCount: update.sentCount, 
                failedCount: update.failedCount,
                totalContacts: update.totalContacts
              } 
            : job
        )
      );
    });

    return () => {
      socket.off("campaign-progress");
    };
  }, [refreshTrigger, currentPage]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="border border-[#075E54] rounded-lg p-6 bg-white shadow-sm overflow-hidden">
      <h2 className="font-semibold text-lg mb-6 text-gray-800">Scheduled Messages History</h2>

      {loading && (
        <p className="text-gray-400 text-sm">Loading...</p>
      )}

      {!loading && jobs.length === 0 && (
        <p className="text-gray-400 text-sm">No scheduled messages yet.</p>
      )}

      <div className="space-y-4">
        {!loading && jobs.map((job) => (
          <div key={job._id} className="flex justify-between items-start pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-green-700 rounded-full mt-2 shrink-0"></div>
              <div>
                <p className="font-medium text-gray-800">{job.campaignId || "Scheduled Message"}</p>
                {job.group && (
                  <p className="text-xs text-green-600 font-semibold">Group: {job.group}</p>
                )}
                <p className="text-sm text-gray-500">{formatDate(job.scheduledAt)}</p>
                <p className="text-xs text-gray-400 truncate max-w-xs">{job.message}</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs font-bold text-green-600">Sent: {job.sentCount}</span>
                  <span className="text-xs font-bold text-red-500">Failed: {job.failedCount}</span>
                  <span className="text-xs font-bold text-gray-500">Total: {job.totalContacts}</span>
                </div>
              </div>
            </div>
            <span className={`text-white text-sm px-3 py-1 rounded shrink-0 font-medium ${
              job.status === "completed" ? "bg-green-600" : "bg-[#065A4C]"
            }`}>
              {job.status === "completed" ? "Sent" : "Scheduled"}
            </span>
          </div>
        ))}
      </div>

      {!loading && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <ContactsPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}