import create from 'zustand'

export const useStore = create((set) => ({
  transactions: [],
  loading: false,
  setTransactions: (tx) => set({ transactions: tx }),
  addTransaction: (t) => set((s) => ({ transactions: [...s.transactions, t] })),
  updateTransaction: (id, patch) => set((s) => ({ transactions: s.transactions.map(x => x.id === id ? { ...x, ...patch } : x) })),
}))