export function friendlyFirebaseError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message : '';

  if (code.includes('popup-closed-by-user')) {
    return 'Se cerró la ventana de Google antes de terminar.';
  }

  if (code.includes('unauthenticated')) {
    return 'Inicia sesión para continuar.';
  }

  if (code.includes('already-exists') || message.includes('ya fue reclamado')) {
    return 'Ese sobre inicial ya fue reclamado.';
  }

  if (code.includes('failed-precondition') || message.includes('No tienes sobres')) {
    return 'No tienes sobres disponibles.';
  }

  if (code.includes('permission-denied')) {
    return 'No tienes permiso para hacer esa acción.';
  }

  if (message) {
    if (message.includes('Firebase no esta configurado')) {
      return 'El inicio de sesión no está disponible por ahora.';
    }

    if (message.includes('desarrollo local') || message.includes('emuladores')) {
      return 'El acceso de prueba no está disponible.';
    }

    return message;
  }

  return 'No se pudo completar la acción.';
}
