import { TestBed } from '@angular/core/testing';

import { FreeTrialService } from './free-trial.service';

describe('FreeTrialService', () => {
  let service: FreeTrialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FreeTrialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
