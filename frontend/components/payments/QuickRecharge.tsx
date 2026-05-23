export default function QuickRecharge() {
  const amounts = [100, 500, 1000];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <h2 className="font-semibold text-gray-700 mb-4">
        Quick Recharge
      </h2>

      <div className="flex gap-3">
        {amounts.map((amt) => (
          <button
            key={amt}
            className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100"
          >
            ₹{amt}
          </button>
        ))}
      </div>
    </div>
  );
}