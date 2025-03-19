
import React from 'react';

const CardInvoiceSummary = ({ title, value, unit, bgColor, textColor }) => {
  return (
    <div className={`p-6 rounded-lg shadow-xl transform hover:scale-105 transition duration-300 ${bgColor}`}>
      <p className={`text-sm font-medium ${textColor}`}>{title}</p>
      <p className={`text-3xl font-bold ${textColor}`}>{value} {unit}</p>
    </div>
  );
};

export default CardInvoiceSummary;

