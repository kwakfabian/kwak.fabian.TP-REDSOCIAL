import { HttpErrorResponse } from '@angular/common/http';

export function apiError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No se pudo conectar con el servidor.';
    const message = error.error?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return error instanceof Error ? error.message : 'Ocurrió un error. Intentá nuevamente.';
}