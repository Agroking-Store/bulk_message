"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ContactsPagination from "../contacts/ContactsPagination";

export default function PaymentHistory({ small, serviceType }: any) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/wallet/transactions?page=${currentPage}&limit=${limit}&type=${serviceType}`);
        if (res && res.data) {
          setTransactions(res.data || []);
          setTotal(res.total || 0);
        } else if (Array.isArray(res)) {
          setTransactions(res);
          setTotal(res.length);
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage, serviceType]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadHistory = () => {
    const doc = new jsPDF();

    // Add Header
    doc.setFontSize(18);
    doc.setTextColor(31, 111, 95); // #1f6f5f
    doc.text("Wallet Transaction History", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Prepare Table Data
    const tableData = transactions.map(tx => [
      formatDate(tx.createdAt),
      tx.type.toUpperCase(),
      `INR ${tx.amount.toFixed(2)}`,
      tx.reason || (tx.type === 'credit' ? 'Wallet Topup' : 'Message Cost'),
      `INR ${tx.balanceAfter?.toFixed(2) || 'N/A'}`,
      "Successful"
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Date", "Type", "Amount", "Reason", "Balance After", "Status"]],
      body: tableData,
      headStyles: { fillColor: [31, 111, 95] },
      alternateRowStyles: { fillColor: [240, 248, 245] },
    });

    doc.save(`Transaction_History_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownloadReceipt = (tx: any) => {
    const doc = new jsPDF();

    // Header / Logo area
    doc.setFillColor(31, 111, 95);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("TRANSACTION RECEIPT", 105, 25, { align: "center" });

    // Receipt Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    let y = 60;
    const leftMargin = 20;
    const rowHeight = 10;

    const details = [
      ["Transaction ID:", tx._id || "N/A"],
      ["Date & Time:", formatDate(tx.createdAt)],
      ["Transaction Type:", tx.type.toUpperCase()],
      ["Payment Status:", "SUCCESSFUL"],
      ["Reference ID:", tx.referenceId || "N/A"]
    ];

    details.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, leftMargin, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), leftMargin + 50, y);
      y += rowHeight;
    });

    // Amount Section
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, y, 190, y);
    y += 15;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Description", leftMargin, y);
    doc.text("Amount", 170, y, { align: "right" });

    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(tx.reason || (tx.type === 'credit' ? 'Wallet Topup' : 'Message Cost'), leftMargin, y);
    doc.text(`INR ${tx.amount.toFixed(2)}`, 170, y, { align: "right" });

    y += 20;
    doc.setFillColor(245, 245, 245);
    doc.rect(leftMargin, y, 170, 15, 'F');

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL AMOUNT:", leftMargin + 5, y + 10);
    doc.text(`INR ${tx.amount.toFixed(2)}`, 165, y + 10, { align: "right" });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer generated receipt and does not require a signature.", 105, 280, { align: "center" });

    doc.save(`Receipt_${tx._id || 'transaction'}.pdf`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-700 text-lg">
          Wallet Transactions
        </h2>

        <button className="bg-[#1f6f5f] hover:bg-[#185a4d] px-3 py-1 rounded-md text-sm text-white transition-colors">
          ⬇ Download Invoice
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 border-b">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Payment Method</th>
              {!small && <th className="p-2 text-left">Status</th>}
              <th className="p-2 text-left">Invoice</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-400">Loading...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>


                <td className="p-2">12 Feb 2026</td>
                <td className="p-2">₹999.00</td>
                <td className="p-2">Card</td>
                {!small && (
                  <td className="p-2">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                      Successful
                    </span>
                  </td>
                )}
                <td className="p-2">
                  <button className="text-white bg-[#1f6f5f] hover:bg-[#185a4d] px-3 py-1 rounded-md text-xs">
                    ⬇ Download
                  </button>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx._id} className="border-b last:border-0 hover:bg-gray-50/50 text-gray-600">
                  <td className="p-2 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                  <td className={`p-2 font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                  </td>
                  <td className="p-2 text-gray-500 truncate max-w-[150px]" title={tx.reason}>
                    {tx.reason || (tx.type === 'credit' ? 'Wallet Topup' : 'Message Cost')}
                  </td>
                  {!small && (
                    <td className="p-2">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                        Successful
                      </span>
                    </td>
                  )}
                  <td className="p-2">
                    <button
                      onClick={() => handleDownloadReceipt(tx)}
                      className="text-white bg-[#1f6f5f] hover:bg-[#185a4d] px-3 py-1 rounded-md text-xs transition-colors flex items-center gap-1"
                    >
                      ⬇ Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-gray-100 mt-2">
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