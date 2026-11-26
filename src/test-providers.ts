import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

// Every spec gets a router and HttpTestingController; no request is answered
// unless the spec flushes it explicitly, so tests never depend on fake data.
export default [
  provideRouter([]),
  provideHttpClient(),
  provideHttpClientTesting(),
];
