export function friendlyFirebaseError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message : '';
  const normalizedMessage = normalize(message);

  if (code.includes('popup-closed-by-user')) {
    return 'Se cerro la ventana de Google antes de terminar.';
  }

  if (code.includes('unauthenticated')) {
    return 'Inicia sesion para continuar.';
  }

  if (code.includes('already-exists') || normalizedMessage.includes('ya fue reclamado')) {
    if (normalizedMessage.includes('mision')) {
      return 'Esa mision ya fue reclamada.';
    }

    if (normalizedMessage.includes('sobre inicial')) {
      return 'Ese sobre inicial ya fue reclamado.';
    }

    return message || 'Ese registro ya existe.';
  }

  if (normalizedMessage.includes('no tienes sobres')) {
    return 'No tienes sobres disponibles.';
  }

  if (code.includes('failed-precondition')) {
    return message || 'Todavia no se cumplen las condiciones para esta accion.';
  }

  if (code.includes('not-found')) {
    return message || 'No se encontro el recurso solicitado.';
  }

  if (code.includes('permission-denied')) {
    return 'No tienes permiso para hacer esa accion.';
  }

  if (message) {
    if (normalizedMessage.includes('firebase no esta configurado')) {
      return 'El inicio de sesion no esta disponible por ahora.';
    }

    if (
      normalizedMessage.includes('desarrollo local') ||
      normalizedMessage.includes('emuladores')
    ) {
      return 'El acceso de prueba no esta disponible.';
    }

    return message;
  }

  return 'No se pudo completar la accion.';
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
