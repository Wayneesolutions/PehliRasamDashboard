import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  getAllPreferencesGroupFields,
  getAllMatchGroups,
  searchCustomerByName,
  createMatchGroupValue,
} from "./Actions"; // Make sure these are implemented

const ExpandableSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border rounded-xl mb-4 bg-white shadow">
      <button
        className="w-full flex justify-between items-center px-4 py-3 text-left bg-gray-100 rounded-t-lg hover:bg-gray-200 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-semibold text-gray-700">{title}</span>
        <span className="text-gray-500">{isExpanded ? "▲" : "▼"}</span>
      </button>
      {isExpanded && <div className="p-4">{children}</div>}
    </div>
  );
};

const MatchCard = ({
  label,
  profileField,
  clientTypes,
  weight,
}: {
  label: string;
  profileField: string;
  clientTypes: string[];
  weight: number;
}) => (
  <div className="p-4 bg-white rounded-lg shadow-sm border mb-2 text-sm">
    <div className="font-medium text-gray-800">{label}</div>
    <div className="text-gray-500">Profile Field: {profileField}</div>
    <div className="text-gray-500">
      Client Types: {Array.isArray(clientTypes) ? clientTypes.join(", ") : "N/A"}
    </div>
    <div className="text-gray-500">Weight: {weight}</div>
  </div>
);

const MatchesPage = () => {
  const { customerId } = useOutletContext<{ customerId: string }>();
  const [matchGroups, setMatchGroups] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [groupList, setGroupList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getAllPreferencesGroupFields();
        setMatchGroups(data || []);
      } catch (error) {
        console.error("Failed to fetch match groups", error);
      }
    };

    const fetchGroups = async () => {
      try {
        const res = await getAllMatchGroups();
        setGroupList(res || []);
      } catch (err) {
        console.error("Failed to fetch group list", err);
      }
    };

    if (customerId) {
      fetchMatches();
      fetchGroups();
    }
  }, [customerId]);

  const handleSearch = async () => {
    try {
      const result = await searchCustomerByName(searchTerm);
      setSearchResults(result || []);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const handleCreate = async () => {
    if (!selectedClientId || !selectedGroupId || !description) return;

    const payload = {
      matchGroupId: selectedGroupId,
      customerId,
      matchCustomerId: selectedClientId,
      matchingDescription: description,
    };

    try {
      await createMatchGroupValue(payload);
      setShowModal(false);
      setSelectedClientId("");
      setSelectedGroupId("");
      setDescription("");
    } catch (err) {
      console.error("Failed to create match", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Match Groups</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm shadow hover:bg-blue-700 transition"
          onClick={() => setShowModal(true)}
        >
          + Add Clients
        </button>
      </div>

      {/* Group Panels */}
      {matchGroups.length > 0 ? (
        matchGroups.map((group) => (
          <ExpandableSection key={group._id} title={group.groupName}>
            {group.fields && group.fields.length > 0 ? (
              group.fields.map((field: any) => (
                <MatchCard
                  key={field._id}
                  label={field.label}
                  profileField={field.profileField}
                  clientTypes={field.clientTypes}
                  weight={field.weight}
                />
              ))
            ) : (
              <div className="text-gray-400 text-sm py-4 text-center">No fields in this group.</div>
            )}
          </ExpandableSection>
        ))
      ) : (
        <div className="text-gray-500 text-center">No match groups found.</div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <h3 className="text-lg font-semibold mb-4">Add New Client Match</h3>

            {/* Search Client */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Search Client</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  onClick={handleSearch}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Search
                </button>
              </div>
              {searchResults.length > 0 && (
                <select
                  className="mt-2 border px-2 py-1 rounded w-full"
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Select a client</option>
                  {searchResults.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Select Group */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Select Matching Group</label>
              <select
                className="border px-2 py-2 rounded w-full text-sm"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="">Select a group</option>
                {groupList.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.groupName}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Matching Description</label>
              <textarea
                rows={3}
                className="border rounded px-3 py-2 w-full text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Save
              </button>
            </div>

            <button
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-lg"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
