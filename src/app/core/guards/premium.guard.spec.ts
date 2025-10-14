import { TestBed } from '@angular/core/testing';

import { PremiumGuard } from '../core/guards/premium.guard';

describe('PremiumGuard', () => {
  let guard: PremiumGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(PremiumGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
