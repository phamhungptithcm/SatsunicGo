import { trackingStages } from './order-tracking';
export const customerOrderFilters = ['all', 'undelivered', 'delivered', 'cancelled'] as const;
export type CustomerOrderFilter = typeof customerOrderFilters[number];
export function parseCustomerOrderFilter(value: string | null): CustomerOrderFilter {
  return customerOrderFilters.find(filter => filter === value) ?? 'all';
}
/** Unknown states are visible in All only, never counted as confirmed progress. */
export function matchesCustomerOrderFilter(stage: string, filter: CustomerOrderFilter) {
  if (filter === 'all') return true;
  if (filter === 'cancelled') return stage === 'CANCELLED';
  if (filter === 'delivered') return stage === 'DELIVERED' || stage === 'COMPLETED';
  return trackingStages.some(known => known === stage) && !['CANCELLED', 'DELIVERED', 'COMPLETED'].includes(stage);
}
