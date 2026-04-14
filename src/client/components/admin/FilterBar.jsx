import React, { useState } from "react";

export default function FilterBar({ onFilterChange }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [barangay, setBarangay] = useState("ALL");

  function handleChange(updated) {
    const newFilters = {
      search: updated.search ?? search,
      status: updated.status ?? status,
      barangay: updated.barangay ?? barangay,
    };

    if (updated.search !== undefined) setSearch(updated.search);
    if (updated.status !== undefined) setStatus(updated.status);
    if (updated.barangay !== undefined) setBarangay(updated.barangay);

    onFilterChange(newFilters);
  }

  return (
    <div style={styles.bar}>

      {/* SEARCH */}
      <input
        style={styles.input}
        placeholder="Search SC-2026-0001..."
        value={search}
        onChange={(e) =>
          handleChange({ search: e.target.value })
        }
      />

      {/* STATUS FILTER */}
      <select
        style={styles.select}
        value={status}
        onChange={(e) =>
          handleChange({ status: e.target.value })
        }
      >
        <option value="ALL">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>

      {/* BARANGAY FILTER */}
      <select
        style={styles.select}
        value={barangay}
        onChange={(e) =>
          handleChange({ barangay: e.target.value })
        }
      >
        <option value="ALL">All Barangay</option>
        <option value="Banilad">Banilad</option>
        <option value="Talamban">Talamban</option>
        <option value="Lahug">Lahug</option>
      </select>

    </div>
  );
}

const styles = {
  bar: {
    display: "flex",
    gap: 12,
    margin: "20px 0",
  },

  input: {
    flex: 1,
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 8,
  },

  select: {
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 8,
  },
};