"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2, FileText } from "lucide-react";
import { contactsApi } from "@/lib/api/contacts";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface UploadCSVModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UploadCSVModal({ isOpen, onClose, onSuccess }: UploadCSVModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

   const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
        const formData = new FormData();
        formData.append("file", file); 

        const res = await apiFetch("/contacts/upload", {
            method: "POST",
            body: formData,
        });

        console.log("API RESPONSE:", res);

        if (res.status === "exists") {
            toast.warning("CSV already exists", { duration: 2000 });
        } 
        else if (res.status === "duplicate") {
            toast.warning("Contacts already exist in this file", { duration: 2000 });
        } 
        else if (res.status === "success") {
            toast.success("CSV Uploaded Successfully", { duration: 2000 });
        } 
        else {
            toast.error(res.message || "Upload failed");
        }

        onSuccess();
        onClose();
        setFile(null);

    } catch (err: any) {
        console.error(err);
        setError(err.message);
        toast.error(err.message || "Something went wrong");
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                <div className="bg-[#075E54] px-6 py-4 flex items-center justify-between text-white">
                    <h2 className="text-xl font-bold">Upload Contacts CSV</h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-medium">{error}</div>}

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#075E54] hover:bg-green-50 transition-all group"
                    >
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        {file ? (
                            <div className="flex flex-col items-center text-center">
                                <FileText size={48} className="text-green-600 mb-2" />
                                <p className="text-sm font-bold text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                                    <Upload size={32} className="text-gray-400 group-hover:text-[#075E54]" />
                                </div>
                                <p className="text-sm font-bold text-gray-700">Click to upload CSV file</p>
                                <p className="text-xs text-gray-400 mt-2">Format: name,phone,group</p>
                            </>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!file || loading}
                            onClick={handleUpload}
                            className="flex-[2] bg-[#075E54] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Upload Now"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}