import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MercadopagoService } from './mercadopago.service';

describe('MercadopagoService', () => {
  let service: MercadopagoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MercadopagoService]
    });
    service = TestBed.inject(MercadopagoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
