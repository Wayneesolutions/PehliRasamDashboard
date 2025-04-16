import { FaInbox } from "react-icons/fa";

const Inbox = () => {
  return (
    <div className="p-8 bg-white shadow-lg rounded-xl">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Inbox Emails</h2>

      {/* No Data Message */}
      <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
        <FaInbox className="text-6xl mb-4 text-gray-300" />
        <p className="text-xl font-medium">No emails here</p>
        <p className="text-sm text-gray-400">Your inbox is currently empty.</p>
      </div>
    </div>
  );
};

export default Inbox;
