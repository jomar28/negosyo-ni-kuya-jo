// src/utils/interest.js

// ----- Date utilities -----
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null; 
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  if (format === 'MMM D, YYYY') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${year}`;
  }
  return `${year}-${month}-${day}`;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export function isAfter(date1, date2) {
  return new Date(date1) > new Date(date2);
}

export function isBefore(date1, date2) {
  return new Date(date1) < new Date(date2);
}

export function diffInDays(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  // Set to noon to avoid DST issues
  d1.setHours(12, 0, 0, 0);
  d2.setHours(12, 0, 0, 0);
  const diff = d2.getTime() - d1.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// ----- Interest utilities -----

export function getEarliestTransactionDate(transactions, groupName = null) {
  const relevantTxs = groupName 
    ? transactions.filter(t => t.group_name === groupName)
    : transactions;

  if (relevantTxs.length === 0) {
      return formatDate(new Date()); 
  }

  const firstTx = relevantTxs
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  return firstTx.date;
}

export function getNextBillingDate(fromDate = null) {
  const ref = fromDate ? new Date(fromDate) : new Date();
  const currentDay = ref.getDate();

  if (currentDay <= 5) {
    ref.setDate(5);
    return formatDate(ref);
  } else {
    const nextMonth = addMonths(ref, 1);
    nextMonth.setDate(5);
    return formatDate(nextMonth);
  }
}

/**
 * Generates a day-by-day ledger of balances and interest.
 * STRICTLY uses rateSchedule. No Multipliers.
 */
export function generateMasterLedger(transactions, groupName, fromDate, toDate, rateSchedule = []) {
  const skipGroupFilter = groupName === null;

  const txs = transactions
    .filter(t => skipGroupFilter ? true : t.group_name === groupName)
    .map(t => ({ ...t, date: formatDate(t.date) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let principal = 0;
  let accruedInterest = 0;
  const ledger = [];
  
  if (!fromDate) return []; 

  let cursor = new Date(fromDate);
  const endDate = new Date(toDate);
  
  cursor.setTime(cursor.getTime() + cursor.getTimezoneOffset() * 60 * 1000);

  while (cursor <= endDate) {
    const cursorStr = formatDate(cursor);
    
    // 1. RATE LOOKUP (From Rates Section)
    const activeRateConfig = rateSchedule
        .filter(r => r.effective_date <= cursorStr)
        .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];

    // Default to 14% if no rate found, otherwise use strict annual rate
    let currentAnnualRate = activeRateConfig ? Number(activeRateConfig.annual_rate) : 0.14;

    const dailyRate = currentAnnualRate / 360;

    // 2. Accrue Interest
    const dailyInterestAdded = principal * dailyRate;
    accruedInterest += dailyInterestAdded;

    let principalPaid = 0;
    let interestPaid = 0;
    
    // 3. Process Transactions
    const txsOnThisDay = txs.filter(t => t.date === cursorStr);

    for (const tx of txsOnThisDay) {
      if (tx.type === 'Withdrawal') {
        principal += Number(tx.amount);
      }
      
      if (tx.type === 'Payment' || tx.type === 'Bank') {
        let paymentAmount = Number(tx.amount);

        const paidToInterest = Math.min(paymentAmount, accruedInterest);
        accruedInterest -= paidToInterest;
        interestPaid += paidToInterest;
        paymentAmount -= paidToInterest;
        
        principal -= paymentAmount;
        principalPaid += paymentAmount;
      }
    }
    
    ledger.push({
      date: cursorStr,
      principal: principal,
      accruedInterest: accruedInterest,
      dailyInterestAdded: dailyInterestAdded,
      principalPaid: principalPaid,
      interestPaid: interestPaid,
      appliedRate: currentAnnualRate
    });

    cursor = addDays(cursor, 1);
  }

  return ledger;
}

export function calculateCurrentBalances(ledger, earliestTxDate) {
  if (ledger.length === 0) {
    return {
      principal: 0,
      accruedInterest: 0,
      accrualStartDate: earliestTxDate,
      daysSinceLastPayment: 0
    };
  }
  
  const lastEntry = ledger[ledger.length - 1];

  let accrualStartDate = earliestTxDate;
  let days = 0;
  
  for (let i = ledger.length - 1; i >= 0; i--) {
    days++;
    if (ledger[i].accruedInterest === 0 && ledger[i].interestPaid === 0) {
      if (i + 1 < ledger.length) {
        accrualStartDate = ledger[i + 1].date;
        days = diffInDays(ledger[i + 1].date, ledger[ledger.length - 1].date) + 1;
      } else {
        accrualStartDate = ledger[i].date;
        days = 0;
      }
      break;
    }
    if (i === 0) {
      accrualStartDate = ledger[0].date;
      days = ledger.length;
    }
  }

  return {
    principal: Number(lastEntry.principal.toFixed(2)),
    accruedInterest: Number(lastEntry.accruedInterest.toFixed(2)),
    accrualStartDate: accrualStartDate,
    daysSinceLastPayment: days
  };
}

export function groupInterestByBilling(ledger, fromDate, toDate, billingDay = 5) {
  if (ledger.length === 0) return [];

  const grouped = {};
  
  let billingDates = {};
  let cursor = new Date(fromDate);
  cursor.setTime(cursor.getTime() + cursor.getTimezoneOffset() * 60 * 1000);
  const endDate = new Date(toDate);

  let currentBillingDate = getNextBillingDate(cursor);
  
  while (new Date(currentBillingDate) <= endDate) {
    billingDates[currentBillingDate] = { accrued: 0, paid: 0 };
    let nextDay = addDays(currentBillingDate, 1);
    currentBillingDate = getNextBillingDate(nextDay);
  }
  billingDates[currentBillingDate] = { accrued: 0, paid: 0 };

  ledger.forEach(day => {
    const dayDate = new Date(day.date);
    dayDate.setTime(dayDate.getTime() + dayDate.getTimezoneOffset() * 60 * 1000);
    
    const billingDateKey = getNextBillingDate(day.date);
    
    if (billingDates[billingDateKey]) {
      billingDates[billingDateKey].accrued += day.dailyInterestAdded;
      billingDates[billingDateKey].paid += day.interestPaid;
    }
  });
  
  return Object.entries(billingDates)
    .map(([billingDate, data]) => ({
      billingDate,
      interestAccrued: Number(data.accrued.toFixed(2)),
      interestPaid: Number(data.paid.toFixed(2)),
      interestDue: Number(Math.max(0, data.accrued - data.paid).toFixed(2))
    }))
    .sort((a, b) => new Date(a.billingDate) - new Date(b.billingDate));
}