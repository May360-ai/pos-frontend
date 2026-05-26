export class CustomValidators {
  // Validar que solo contenga letras y espacios
  static onlyLetters(value: string): boolean {
    if (!value) return false;
    return /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/.test(value);
  }

  // Validar que solo contenga números
  static onlyNumbers(value: string): boolean {
    if (!value) return false;
    return /^\d+$/.test(value);
  }

  // Validar email
  static validEmail(value: string): boolean {
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // Validar teléfono (10 dígitos)
  static validPhone(value: string): boolean {
    if (!value) return false;
    return /^\d{10}$/.test(value);
  }

  // Validar número positivo
  static validPositiveNumber(value: number): boolean {
    return value > 0;
  }

  // Obtener mensaje de error
  static getErrorMessage(field: string, type: string): string {
    const messages: { [key: string]: { [key: string]: string } } = {
      name: {
        required: 'El nombre es obligatorio',
        onlyLetters: 'El nombre solo puede contener letras',
      },
      firstName: {
        required: 'El nombre es obligatorio',
        onlyLetters: 'El nombre solo puede contener letras',
      },
      lastName: {
        required: 'El apellido es obligatorio',
        onlyLetters: 'El apellido solo puede contener letras',
      },
      email: {
        required: 'El email es obligatorio',
        validEmail: 'El email no es válido',
      },
      phone: {
        required: 'El teléfono es obligatorio',
        onlyNumbers: 'El teléfono solo puede contener números',
        validPhone: 'El teléfono debe tener 10 dígitos',
      },
      address: {
        required: 'La dirección es obligatoria',
      },
      description: {
        required: 'La descripción es obligatoria',
      },
      price: {
        required: 'El precio es obligatorio',
        validPositive: 'El precio debe ser mayor a 0',
      },
      stock: {
        required: 'El stock es obligatorio',
        validPositive: 'El stock debe ser mayor o igual a 0',
      },
      percentage: {
        required: 'El porcentaje es obligatorio',
        validPositive: 'El porcentaje debe estar entre 0 y 100',
      },
      clientId: {
        required: 'Debes seleccionar un cliente',
      },
      productId: {
        required: 'Debes seleccionar un producto',
      },
      quantity: {
        required: 'La cantidad es obligatoria',
        validPositive: 'La cantidad debe ser mayor a 0',
      },
    };

    return messages[field]?.[type] || `${field} no es válido`;
  }
}