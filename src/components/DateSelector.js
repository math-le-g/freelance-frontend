import React from 'react';

const DateSelector = ({ selectedDate, setSelectedDate }) => {
  return (
    <div>
      <input
        type="date"
        value={selectedDate || ''}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
      />
    </div>
  );
};

export default DateSelector;



