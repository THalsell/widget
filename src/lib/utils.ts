// Utility functions

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

export function calculateFees(amount: number): number {
  // TODO: Implement fee calculation logic
  return Math.round(amount * 0.029 + 30);
}
