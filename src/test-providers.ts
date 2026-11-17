import { provideHttpClient, withInterceptors, HttpResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

// Existing generated smoke tests have no HTTP/router providers.
// Deterministic fixtures exist only in this test environment, never production.
export default [
  provideRouter([]),
  provideHttpClient(withInterceptors([req => of(new HttpResponse({
    body: req.url.includes('/dashboard/') ? {
      patient: { id: 1, nombres: 'Prueba', apellidos: 'Prueba' },
      symptoms: [], medications: [], upcoming_appointments: [], recent_notes: [],
      active_alerts: [], historical_analysis: { score: 0, nivel: 'bajo', tendencias: [], registros_analizados: 0 },
      current_risk_level: 'bajo'
    } : [],
  }))])),
];
