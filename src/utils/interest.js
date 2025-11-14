// src/utils/interest.js

// ----- Date utilities (Unchanged) -----
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null; // Invalid date check
  
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
  // 🛑 REMOVED Timezone adjustment. This should only be done at loop initialization.
  // d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000);
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

// ----- Interest utilities (Completely Rewritten) -----

/**
 * Gets the date of the very first transaction for a group.
 * This is the required start date for the master ledger.
 */
export function getEarliestTransactionDate(transactions, groupName) {
  const firstTx = transactions
    .filter(t => t.group_name === groupName)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  if (!firstTx) {
    return formatDate(new Date()); // Fallback to today if no txs
  }
  return firstTx.date;
}

/**
 * Calculates the next billing date (5th of the month).
 */
export function getNextBillingDate(fromDate = null) {
  const ref = fromDate ? new Date(fromDate) : new Date();
  // 🛑 REMOVED Timezone adjustment. This should only be done at loop initialization.
  // ref.setTime(ref.getTime() + ref.getTimezoneOffset() * 60 * 1000);
  
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
 * ✅ NEW: The "Single Source of Truth"
 * Generates a day-by-day ledger of balances and interest,
 * correctly applying payments based on bank's priority rules.
 */
export function generateMasterLedger(transactions, groupName, fromDate, toDate, dailyRate) {
  const txs = transactions
    .filter(t => t.group_name === groupName)
    .map(t => ({ ...t, date: formatDate(t.date) })) // Ensure date is standardized
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let principal = 0;
  let accruedInterest = 0;
  const ledger = [];
  
  if (!fromDate) return []; // No start date, no ledger

  let cursor = new Date(fromDate);
  const endDate = new Date(toDate);
  
  // ✅ This is the ONLY place we should adjust for timezone, at the start of the loop.
  cursor.setTime(cursor.getTime() + cursor.getTimezoneOffset() * 60 * 1000);

  while (cursor <= endDate) {
    const cursorStr = formatDate(cursor);
    
    // 1. Accrue interest from *yesterday's* principal
    const dailyInterestAdded = principal * dailyRate;
    accruedInterest += dailyInterestAdded;

    let principalPaid = 0;
    let interestPaid = 0;
    
    // 2. Process all transactions for the current day
    const txsOnThisDay = txs.filter(t => t.date === cursorStr);

    for (const tx of txsOnThisDay) {
      if (tx.type === 'Withdrawal') {
        principal += Number(tx.amount);
      }
      
      // ✅ BANK LOGIC: Simplified to "Payment"
      if (tx.type === 'Payment') {
        let paymentAmount = Number(tx.amount);

        // 1st: Pay down accrued interest
        const paidToInterest = Math.min(paymentAmount, accruedInterest);
        accruedInterest -= paidToInterest;
        interestPaid += paidToInterest;
        paymentAmount -= paidToInterest;
        
        // 2nd: Remainder pays down principal
        principal -= paymentAmount;
        principalPaid += paymentAmount;
      }
    }
    
    // 3. Store the state for this day
    // 🛑 REMOVED all rounding. Store full-precision numbers in the ledger.
    ledger.push({
      date: cursorStr,
      principal: principal,
      accruedInterest: accruedInterest,
      dailyInterestAdded: dailyInterestAdded,
      principalPaid: principalPaid,
      interestPaid: interestPaid
    });

    // ✅ This now correctly increments the cursor
    cursor = addDays(cursor, 1);
  }

  return ledger;
}

/**
 * ✅ NEW: Reads the master ledger to get current balances.
 */
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

  // Find the start of the current unbilled period
  // (the day *after* interest was last at 0)
  let accrualStartDate = earliestTxDate;
  let days = 0;
  
  for (let i = ledger.length - 1; i >= 0; i--) {
    days++;
    if (ledger[i].accruedInterest === 0 && ledger[i].interestPaid === 0) {
      // If we are on the day it hit zero, the start date is the *next* day
      if (i + 1 < ledger.length) {
        accrualStartDate = ledger[i + 1].date;
        days = diffInDays(ledger[i + 1].date, ledger[ledger.length - 1].date) + 1;
      } else {
        // This was the last day, so nothing has accrued
        accrualStartDate = ledger[i].date;
        days = 0;
      }
      break;
    }
    // If we reach the beginning without finding a zero, the start date is the first date
    if (i === 0) {
      accrualStartDate = ledger[0].date;
      days = ledger.length;
    }
  }


  // ✅ Round ONLY at the very end, before returning.
  return {
    principal: Number(lastEntry.principal.toFixed(2)),
    accruedInterest: Number(lastEntry.accruedInterest.toFixed(2)),
    accrualStartDate: accrualStartDate,
    daysSinceLastPayment: days
  };
}

/**
 * ✅ NEW: Reads the master ledger to group interest by billing cycles.
 */
export function groupInterestByBilling(ledger, fromDate, toDate, billingDay = 5) {
  if (ledger.length === 0) return [];

  const grouped = {};
  
  // 1. Find all billing dates in the range
  let billingDates = {};
  let cursor = new Date(fromDate);
  // ✅ This is the ONLY place we should adjust for timezone, at the start of the loop.
  cursor.setTime(cursor.getTime() + cursor.getTimezoneOffset() * 60 * 1000);
  const endDate = new Date(toDate);

  let currentBillingDate = getNextBillingDate(cursor);
  
  while (new Date(currentBillingDate) <= endDate) {
    billingDates[currentBillingDate] = { accrued: 0, paid: 0 };
    // Get the *next* billing date
    let nextDay = addDays(currentBillingDate, 1);
    currentBillingDate = getNextBillingDate(nextDay);
  }
  // Add one more for the current partial period
  billingDates[currentBillingDate] = { accrued: 0, paid: 0 };

  // 2. Sum daily interest and payments into their correct billing cycle
  ledger.forEach(day => {
    const dayDate = new Date(day.date);
    // ✅ This is the ONLY place we should adjust for timezone, at the start of the loop.
    dayDate.setTime(dayDate.getTime() + dayDate.getTimezoneOffset() * 60 * 1000);
    
    // Find which billing date this day belongs to
    const billingDateKey = getNextBillingDate(day.date);
    
    if (billingDates[billingDateKey]) {
      billingDates[billingDateKey].accrued += day.dailyInterestAdded;
      billingDates[billingDateKey].paid += day.interestPaid;
    }
  });
  
  // 3. Calculate "due" amount (what's left)
  return Object.entries(billingDates)
    .map(([billingDate, data]) => ({
      billingDate,
      // ✅ Round ONLY at the very end, before returning.
      interestAccrued: Number(data.accrued.toFixed(2)),
      interestPaid: Number(data.paid.toFixed(2)),
      // Interest Due is what accrued in that period, *minus* what was paid in that period.
      // We use Math.max to prevent negative balances from "rolling over" visually.
      // The main `accruedInterest` balance in the ledger handles the *actual* rollover.
      interestDue: Number(Math.max(0, data.accrued - data.paid).toFixed(2))
    }))
    .sort((a, b) => new Date(a.billingDate) - new Date(b.billingDate));
}