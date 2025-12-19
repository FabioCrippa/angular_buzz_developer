import { TestBed } from '@angular/core/testing';
import { DailyAttemptsService } from './daily-attempts.service';

describe('DailyAttemptsService', () => {
  let service: DailyAttemptsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyAttemptsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
