import React, { useState } from 'react';
import { formatCurrency } from '../utils/helpers';

function TsikotStats({ stats }) {
  const [openYears, setOpenYears] = useState({
    "Profit & Loss by Yearprofit": true,
    "Cost of All Cars (Capital)costAll": true,
    "Cost of Sold Cars (COGS)costSold": true,
    "Misc by Yearmisc": true,
    "Sell Price by YearsellPrice": true,
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const YearBreakdown = ({ title, totalValue, yearData, dataKey, isCurrency = true, isProfit = false }) => {
    const isOpen = openYears[title + dataKey];
    
    // Toggle Logic
    const handleToggle = () => {
        setOpenYears(p => ({ ...p, [title + dataKey]: !p[title + dataKey] }));
    };

    const totalValueClass = isProfit
      ? (totalValue >= 0 ? 'text-green-600' : 'text-rose-600')
      : 'text-gray-900';

    return (
      // 1. Add onClick to container
      // 2. Add cursor-pointer
      <div 
        onClick={handleToggle}
        className='p-5 bg-[#F0EFEA] border-2 border-black relative pb-12 transition-all duration-300 cursor-pointer'
      >
        <div className='flex justify-between items-center'>
          <div>
            <span className='text-lg font-bold text-gray-900'>{title}</span>
          </div>
          <div className='text-right'>
            <div className={`text-2xl font-bold ${totalValueClass}`}>
              {isCurrency ? formatCurrency(totalValue) : totalValue}
            </div>
          </div>
        </div>

        {isOpen && (
          <div className='mt-4 pt-4 border-t border-gray-300 space-y-3'>
            {Object.keys(yearData).sort((a, b) => b - a).map(year => {
              const data = yearData[year];
              const yearValue = data[dataKey];
              
              let count = 0;
              let countLabel = '';
              
              if (dataKey === 'misc') {
                  count = data.miscCount;
                  countLabel = 'items';
              } else if (dataKey === 'costAll') {
                  count = data.boughtCount;
                  countLabel = 'bought';
              } else {
                  count = data.sold;
                  countLabel = 'sold';
              }

              if (count === 0 && yearValue === 0) return null;

              return (
                <div key={year}>
                  <div className='flex justify-between text-sm font-semibold mb-1 text-gray-900'>
                    <span>{year}</span>
                    <span className={isProfit ? (yearValue >= 0 ? 'text-green-600' : 'text-rose-600') : 'text-gray-900'}>
                      {isCurrency ? formatCurrency(yearValue) : yearValue}
                      <span className='text-xs text-gray-500 font-normal ml-2'>({count} {countLabel})</span>
                    </span>
                  </div>
                  {data.byMonth.map((monthData, monthIndex) => {
                    if (monthData[dataKey] === 0) return null;
                    const monthValue = monthData[dataKey];
                    return (
                      <div key={monthIndex} className='flex justify-between text-sm pl-4 py-0.5'>
                        <span className='text-gray-600'>{monthNames[monthIndex]}</span>
                        <span className={`font-medium ${isProfit ? (monthValue >= 0 ? 'text-green-600' : 'text-rose-600') : 'text-gray-700'}`}>
                          {isCurrency ? formatCurrency(monthValue) : monthValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2'>
          {/* 3. Remove specific onClick to allow bubble-up */}
          <button
            className={`p-1.5 bg-[#F0EFEA] border-2 border-black rounded-full text-gray-900 transition-all duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            aria-expanded={isOpen}
            aria-label={`Toggle details for ${title}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      <h4 className='text-xl font-bold text-gray-900 px-1'>Tsikot Stats</h4>

      <YearBreakdown
        title="Profit & Loss by Year"
        totalValue={stats.totalProfit}
        yearData={stats.byYear}
        dataKey="profit"
        isProfit={true}
      />

      <YearBreakdown
        title="Cost of All Cars (Capital)"
        totalValue={stats.totalCostAll}
        yearData={stats.byYear}
        dataKey="costAll"
      />

      <YearBreakdown
        title="Cost of Sold Cars (COGS)"
        totalValue={stats.totalCostSold}
        yearData={stats.byYear}
        dataKey="costSold"
      />

      <YearBreakdown
        title="Sell Price by Year"
        totalValue={stats.totalSellPriceSold}
        yearData={stats.byYear}
        dataKey="sellPrice"
      />

      <YearBreakdown
        title="Misc by Year"
        totalValue={stats.totalMiscSold}
        yearData={stats.byYear}
        dataKey="misc"
      />
    </div>
  );
}

export default TsikotStats;