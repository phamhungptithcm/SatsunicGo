import { expect, test } from 'vitest';
import { matchesCustomerOrderFilter, parseCustomerOrderFilter } from '../../packages/domain/customer-order-filter';
import { trackingStages } from '../../packages/domain/order-tracking';
test('every known stage belongs to exactly one delivery group', () => {
  for (const stage of trackingStages) {
    expect(['undelivered','delivered','cancelled'].filter(filter => matchesCustomerOrderFilter(stage, parseCustomerOrderFilter(filter)))).toHaveLength(1);
    expect(matchesCustomerOrderFilter(stage, 'all')).toBe(true);
  }
});
test('delivered and completed both delivered; cancellation not a delivery', () => {
  expect(matchesCustomerOrderFilter('DELIVERED', 'delivered')).toBe(true);
  expect(matchesCustomerOrderFilter('COMPLETED', 'delivered')).toBe(true);
  expect(matchesCustomerOrderFilter('CANCELLED', 'undelivered')).toBe(false);
  expect(matchesCustomerOrderFilter('IN_TRANSIT', 'delivered')).toBe(false);
});
test('unknown stages cannot imply confirmed progress', () => {
  for (const value of ['', 'delivered', 'FUTURE_STATE']) {
    expect(matchesCustomerOrderFilter(value, 'all')).toBe(true);
    for (const filter of ['undelivered','delivered','cancelled'] as const) expect(matchesCustomerOrderFilter(value, filter)).toBe(false);
  }
});
test('invalid URL filter safely shows all without altering stored orders', () => {
  for (const value of [null, '', 'DELIVERED', 'ownerId=other']) expect(parseCustomerOrderFilter(value)).toBe('all');
});
