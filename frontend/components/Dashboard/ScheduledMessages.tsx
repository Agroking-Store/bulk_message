export default function ScheduledMessages({ messages = [] }: { messages?: any[] }) {

    return (

        <div className="border border-[#075E54] rounded-lg p-5 bg-white">

            <h2 className="font-semibold mb-5 text-xl">
                Scheduled Activity
            </h2>

            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">No scheduled campaigns</p>
                    <p className="text-xs mt-1">Campaigns will appear here when scheduled</p>
                </div>
            ) : (
                <div className="space-y-6">

                    {messages.map((m, i) => (

                        <div key={i} className="flex justify-between items-center">

                            <div className="flex-1">
                                <p className="font-medium text-gray-800 line-clamp-1">{m.campaignName || 'Scheduled Message'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[#075E54] font-semibold text-xs">Group: {m.group || 'All'}</p>
                                    <span className="text-gray-300">-</span>
                                    <p className="text-gray-500 text-xs">
                                        {m.time}
                                    </p>
                                </div>
                                <p className="text-gray-400 text-[10px] mt-1 line-clamp-1 italic">Msg: {m.message}</p>
                            </div>

                            <span className="bg-[#075E54] text-white px-3 py-1 rounded text-sm">
                                Scheduled
                            </span>

                        </div>

                    ))}

                </div>
            )}

        </div>

    );
}