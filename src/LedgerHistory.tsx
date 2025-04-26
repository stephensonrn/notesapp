// src/LedgerHistory.jsx
import React from 'react';
import type { Schema } from '../amplify/data/resource'; // Import schema for entry type

interface LedgerHistoryProps {
  entries: Schema['LedgerEntry'][];
  isLoading: boolean;
}

function LedgerHistory({ entries, isLoading }: LedgerHistoryProps) {
  if (isLoading) {
    return <p>Loading history...</p>;
  }

  if (entries.length === 0) {
    return <p>No transactions recorded yet.</p>;
  }

  // Function to format date/time nicely
  const formatDate = (dateString: string | undefined | null) => {
      if (!dateString) return '';
      const options: Intl.DateTimeFormatOptions = {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true
      };
      return new Date(dateString).toLocaleTimeString('en-GB', options);
  }

  // Function to format amount with sign based on type
  const formatAmount = (entry: Schema['LedgerEntry']) => {
      const isNegative = entry.type === 'CREDIT_NOTE' || entry.type === 'DECREASE_ADJUSTMENT';
      const sign = isNegative ? '-' : '+';
      const formatted = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP' // Adjust currency
      }).format(entry.amount);
      // Remove currency symbol and add sign
      return `${sign} ${formatted.replace(/[^0-9.-]+/g,"")}`;
  }

  // Function to format type string for display
  const formatType = (type: string) => {
      return type.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  }


  return (
    <div style={{ marginTop: '20px' }}>
      <h4>Transaction History</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Description</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Amount (£)</th>
          </tr>
        </thead>
        <tbody>
          {/* Render entries in reverse chronological order for display */}
          {[...entries].reverse().map(entry => (
            <tr key={entry.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(entry.createdAt)}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatType(entry.type)}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{entry.description}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{formatAmount(entry)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default LedgerHistory;