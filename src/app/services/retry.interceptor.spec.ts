import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { retryInterceptor } from './retry.interceptor';

describe('retryInterceptor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([retryInterceptor])), provideHttpClientTesting()],
    });
  });

  afterEach(() => vi.useRealTimers());

  it('retries a GET once after a transient failure', () => {
    let result: unknown;
    TestBed.inject(HttpClient).get('/api/patients/').subscribe(value => (result = value));
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/patients/').flush(null, { status: 503, statusText: 'Unavailable' });
    vi.advanceTimersByTime(600);
    http.expectOne('/api/patients/').flush([{ id: 1 }]);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('never retries writes or client errors', () => {
    const client = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);
    client.post('/api/notes/patients/1', {}).subscribe({ error: () => {} });
    http.expectOne('/api/notes/patients/1').flush(null, { status: 503, statusText: 'x' });
    client.get('/api/patients/9').subscribe({ error: () => {} });
    http.expectOne('/api/patients/9').flush(null, { status: 403, statusText: 'x' });
    vi.advanceTimersByTime(1000);
    http.verify();
  });
});
