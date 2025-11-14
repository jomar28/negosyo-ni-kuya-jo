import React, { useState } from 'react';
import {
  formatDate,
  getNextBillingDate,
  getEarliestTransactionDate,
  generateMasterLedger,
  calculateCurrentBalances,
  groupInterestByBilling
} from '../utils/interest';
import { calculateMiscTotal, formatCurrency } from '../utils/helpers';
import TsikotStats from './TsikotStats';

function Dashboard({ transactions, tsikots }) {
  const groups = Array.from(new Set(transactions.map(t => t.group_name)));
  const today = formatDate(new Date());
  const nextBilling = getNextBillingDate();
  const [open, setOpen] = useState({});

  const groupSummaries = React.useMemo(() => {
    return groups.map(g => {
      const annualRate = g === 'Jomar' ? 0.14 : 0.07;
      const dailyRate = annualRate / 360;
      const earliestTxDate = getEarliestTransactionDate(transactions, g);
      const ledger = generateMasterLedger(transactions, g, earliestTxDate, today, dailyRate);
      const current = calculateCurrentBalances(ledger, earliestTxDate);
      const billingBreakdown = groupInterestByBilling(ledger, earliestTxDate, today);

      return {
        group: g,
        balance: current.principal,
        unbilledInterest: current.accruedInterest,
        days: current.daysSinceLastPayment,
        since: current.accrualStartDate,
        billingBreakdown: billingBreakdown,
        ledger: ledger,
        earliestTxDate: earliestTxDate
      };
    });
  }, [transactions, groups, today]);

  const tsikotStats = React.useMemo(() => {
    const acc = { 
      totalProfit: 0, 
      inventoryCost: 0, 
      inventoryCount: 0, 
      byYear: {},
      totalCostSold: 0, 
      totalCostAll: 0,  
      totalMiscSold: 0, 
      totalSellPriceSold: 0 
    };
    
    const initializeYear = (year) => { 
      if (!acc.byYear[year]) { 
        acc.byYear[year] = { 
          profit: 0, costSold: 0, costAll: 0, misc: 0, sellPrice: 0, sold: 0, boughtCount: 0, miscCount: 0, 
          byMonth: Array(12).fill(null).map(() => ({ profit: 0, costSold: 0, costAll: 0, misc: 0, sellPrice: 0, sold: 0, boughtCount: 0, miscCount: 0 })) 
        }; 
      } 
    };

    for (const car of tsikots) {
      const totalMisc = calculateMiscTotal(car.miscellaneous);
      const buyPrice = Number(car.buy_price);
      const fullCost = buyPrice + totalMisc;

      if (car.date_bought) {
        const boughtDate = new Date(car.date_bought);
        const boughtYear = boughtDate.getFullYear();
        const boughtMonth = boughtDate.getMonth();
        initializeYear(boughtYear);
        acc.totalCostAll += buyPrice;
        acc.byYear[boughtYear].costAll += buyPrice;
        acc.byYear[boughtYear].boughtCount += 1;
        acc.byYear[boughtYear].byMonth[boughtMonth].costAll += buyPrice;
        acc.byYear[boughtYear].byMonth[boughtMonth].boughtCount += 1;
      }

      if (!car.date_sold || !car.sell_price) { 
        acc.inventoryCost += fullCost; 
        acc.inventoryCount += 1; 
      }

      if (Array.isArray(car.miscellaneous)) {
        car.miscellaneous.forEach(m => {
          const miscDate = new Date(m.date || car.date_bought);
          const miscYear = miscDate.getFullYear();
          const miscMonth = miscDate.getMonth();
          const miscAmount = Number(m.amount) || 0;
          initializeYear(miscYear);
          acc.totalMiscSold += miscAmount; 
          acc.byYear[miscYear].misc += miscAmount;
          acc.byYear[miscYear].miscCount += 1;
          acc.byYear[miscYear].byMonth[miscMonth].misc += miscAmount;
          acc.byYear[miscYear].byMonth[miscMonth].miscCount += 1;
        });
      }

      if (car.date_sold && car.sell_price) {
        const sellPrice = Number(car.sell_price);
        const profit = sellPrice - fullCost;
        const soldDate = new Date(car.date_sold);
        const soldYear = soldDate.getFullYear();
        const soldMonth = soldDate.getMonth();
        acc.totalProfit += profit; 
        acc.totalCostSold += buyPrice; 
        acc.totalSellPriceSold += sellPrice;
        initializeYear(soldYear);
        acc.byYear[soldYear].profit += profit; 
        acc.byYear[soldYear].costSold += buyPrice; 
        acc.byYear[soldYear].sellPrice += sellPrice; 
        acc.byYear[soldYear].sold += 1;
        const monthData = acc.byYear[soldYear].byMonth[soldMonth];
        monthData.profit += profit; 
        monthData.costSold += buyPrice; 
        monthData.sellPrice += sellPrice; 
        monthData.sold += 1;
      }
    }
    return acc;
  }, [tsikots]);

  const totalBalance = groupSummaries.reduce((s, x) => s + x.balance, 0);
  const totalInterest = groupSummaries.reduce((s, x) => s + x.unbilledInterest, 0);

  const totalBillingSummary = React.useMemo(() => {
    let summary = {};
    groupSummaries.forEach(g => { 
      g.billingBreakdown.forEach(b => { 
        if (b.interestDue > 0) { 
          if (!summary[b.billingDate]) { summary[b.billingDate] = 0; } 
          summary[b.billingDate] += b.interestDue; 
        } 
      }); 
    });
    return Object.entries(summary).map(([billingDate, interest]) => ({ billingDate, interest: Number(interest.toFixed(2)) })).sort((a, b) => new Date(a.billingDate) - new Date(b.billingDate));
  }, [groupSummaries]);

  const formatInterestDisplay = (group, amount) => formatCurrency(amount);

  // Reusable Card Styles
  const cardStyle = 'p-5 md:p-6 bg-[#F0EFEA] border-2 border-black';
  const collapseButtonStyle = 'p-1 bg-[#F0EFEA] border-2 border-black rounded-full text-gray-900 hover:bg-gray-100 transition-transform duration-300';

  return (
    <div className='max-w-7xl mx-auto space-y-6'>
      <h3 className='text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-900'>Dashboard</h3>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10'>
        <div className='space-y-6 md:space-y-8'>
          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4'>
            
            <div className={cardStyle}>
              <div className='text-xs md:text-sm text-gray-600 mb-1'>Total Principal</div>
              <div className='text-2xl md:text-3xl font-bold text-gray-900'>{formatCurrency(totalBalance)}</div>
            </div>
            
            <div className={cardStyle}>
              <div className='text-xs md:text-sm text-gray-600 mb-1'>Total Unbilled Interest</div>
              <div className='text-2xl md:text-3xl font-bold text-orange-600'>{formatCurrency(totalInterest)}</div>
            </div>
            
            <div className={cardStyle}>
              <div className='text-xs md:text-sm text-gray-600 mb-1'>Next Billing Date</div>
              <div className='text-xl md:text-2xl font-bold text-gray-900'>{formatDate(nextBilling, 'MMM D, YYYY')}</div>
            </div>
          </div>

          <div className='space-y-6'>
            <h4 className='text-lg md:text-xl font-semibold text-gray-900'>Groups</h4>
            {groupSummaries.map(g => {
              const { billingBreakdown } = g;
              const toggleOpen = () => setOpen(prev => ({ ...prev, [g.group]: !prev[g.group] }));
              const isGroupOpen = open[g.group];

              return (
                <div key={g.group} className='p-4 md:p-5 bg-[#F0EFEA] border-2 border-black relative pb-10'>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-4'>
                      <div>
                        <div className='text-lg font-semibold text-gray-900'>{g.group}</div>
                        <div className='text-xs md:text-sm text-gray-500 mt-1'>Interest Balance</div>
                      </div>
                    </div>

                    <div className='text-right'>
                      <div className='text-xl md:text-2xl font-bold text-gray-900'>{formatCurrency(g.balance)}</div>
                      <div className='text-xs md:text-sm text-orange-600 font-medium mt-1'>
                        Interest: {formatInterestDisplay(g.group, g.unbilledInterest)}
                      </div>
                    </div>
                  </div>

                  {isGroupOpen && (
                    <div className='mt-4 border-t border-gray-300 pt-3 space-y-2'>
                      <div className='flex justify-between text-xs md:text-sm font-semibold text-gray-600 border-b border-gray-300 pb-1 mb-2'>
                        <span>Billing Date</span>
                        <span>Interest Due</span>
                      </div>
                      {billingBreakdown.map(b => (
                        <div key={b.billingDate} className='flex justify-between text-xs md:text-sm'>
                          <span>{formatDate(b.billingDate, 'MMM D, YY')}</span>
                          <span className={b.interestDue === 0 ? 'text-gray-400' : 'text-orange-600 font-medium'}>
                            {formatInterestDisplay(g.group, b.interestDue)}
                          </span>
                        </div>
                      ))}
                      <div className='flex justify-between text-xs md:text-sm font-medium text-gray-900 border-t border-gray-300 pt-2 mt-2'>
                        <span>Current Unbilled</span>
                        <span className='text-orange-600'>
                          {formatInterestDisplay(g.group, g.unbilledInterest)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2'>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
                      className={`${collapseButtonStyle} ${isGroupOpen ? 'rotate-180' : 'rotate-0'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <h4 className='text-lg md:text-xl font-semibold mb-4 text-gray-900'>Billings</h4>
            <div className={cardStyle}>
              {totalBillingSummary.length > 0 ? (
                <div className='space-y-2'>
                  {totalBillingSummary.map(b => (
                    <div key={b.billingDate} className='flex justify-between text-sm md:text-base border-b border-gray-300 pb-2 last:border-b-0 last:pb-0'>
                      <span className='text-gray-700'>{formatDate(b.billingDate, 'MMM D, YYYY')}</span>
                      <span className='text-orange-600'>{formatCurrency(b.interest)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-gray-500 text-sm'>No outstanding interest.</div>
              )}
            </div>
          </div>
        </div>

        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4'>
            <div className={cardStyle}>
              <div className='text-xs md:text-sm text-gray-600 mb-1'>Total Profit (Sold)</div>
              <div className={`text-2xl md:text-3xl font-bold ${tsikotStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(tsikotStats.totalProfit)}
              </div>
            </div>
            <div className={cardStyle}>
              <div className='text-xs md:text-sm text-gray-600 mb-1'>Inventory (Cost)</div>
              <div className='text-2xl md:text-3xl font-bold text-gray-900'>{formatCurrency(tsikotStats.inventoryCost)}</div>
            </div>
            <div className={cardStyle}>
              <div className='text-xs md:text-sm text-gray-600 mb-1'>Inventory (Count)</div>
              <div className='text-2xl md:text-3xl font-bold text-gray-900'>{tsikotStats.inventoryCount}</div>
            </div>
          </div>
          <TsikotStats stats={tsikotStats} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;