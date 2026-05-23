"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { contactsApi, Contact } from "@/lib/api/contacts";
import { toast } from "sonner";

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Contact | null;
}

export default function AddContactModal({ isOpen, onClose, onSuccess, initialData }: AddContactModalProps) {
    const [formData, setFormData] = useState({ name: "", phone: "", email: "", group: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                phone: initialData.phone || "",
                email: initialData.email || "",  
                group: initialData.group || ""
            });
        } else {
            setFormData({ name: "", phone: "", email: "", group: "" }); 
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const validatePhone = (phone: string) => {
        if (!phone) return true; 
        const stripped = phone.replace(/[\s+]/g, '');
        if (stripped.startsWith('0')) {
            const afterZero = stripped.substring(1);
            return /^\d+$/.test(afterZero) && (afterZero.length === 10 || (afterZero.length === 12 && afterZero.startsWith('91')));
        }
        return /^\d+$/.test(stripped) && (stripped.length === 10 || (stripped.length === 12 && stripped.startsWith('91')));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("FORM DATA:", formData);
        const stripped = formData.phone.replace(/[\s+]/g, '');
        const coreNumber = stripped.startsWith('0') ? stripped.substring(1) : stripped;
        
        if (!/^\d+$/.test(coreNumber)) {
            setError("Invalid phone number");
            return;
        }

        if (coreNumber.length !== 10 && !(coreNumber.length === 12 && coreNumber.startsWith('91'))) {
            setError("Invalid phone number");
            return;
        }

if (formData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|in|org|net)$/i;

    if (!emailRegex.test(formData.email)) {
        setError("Invalid email address");
        return;
    }
}
        setLoading(true);
        setError(null);
       try {
    if (initialData?._id) {
        await contactsApi.update(initialData._id, formData);
        toast("Contact Updated", {
            icon: "✏️",
            duration: 2000,
        });
    } else {
        await contactsApi.create(formData);
        toast.success("Contact Added", { duration: 2000 });
    }

    onSuccess();
    onClose();
            if (!initialData) setFormData({ name: "", phone: "", email: "", group: "" }); 
        } catch (err: any) {
    setError(err.message);
    toast.error(err.message || "Operation failed");
}
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                <div className="bg-[#075E54] px-6 py-4 flex items-center justify-between text-white">
                    <h2 className="text-xl font-bold">{initialData ? "Edit Contact" : "Add New Contact"}</h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-medium">{error}</div>}

                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Alok Mehta"
                            className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all font-medium"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                  
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. +91 9876543210"
                            className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all font-medium"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                   
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email (Optional)</label>
                        <input
                            type="email"
                            placeholder="e.g. alok@gmail.com"
                            className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all font-medium"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Group (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Customers, Students"
                            className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all font-medium"
                            value={formData.group}
                            onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                        />
                    </div>

                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full bg-[#075E54] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (initialData ? "Update Contact" : "Save Contact")}
                    </button>
                </form>
            </div>
        </div>
    );
}