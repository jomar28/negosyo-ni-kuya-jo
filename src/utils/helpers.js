export function simpleIsEqual(objA, objB) {
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }
  return true;
}

export const calculateMiscTotal = (miscArray) => {
  if (!Array.isArray(miscArray)) return 0;
  return miscArray.reduce((acc, item) => acc + Number(item.amount || 0), 0);
};

export const formatCurrency = (amount) =>
  `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;