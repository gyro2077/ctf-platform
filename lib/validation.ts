// lib/validation.ts

/**
 * Valida una cédula ecuatoriana usando el algoritmo Módulo 10.
 * @param cedula - El string de 10 dígitos de la cédula.
 * @returns `true` si es válida, `false` si no.
 */
export function validateEcuadorianID(cedula: string): boolean {
  if (typeof cedula !== 'string' || cedula.length !== 10 || !/^\d+$/.test(cedula)) {
    return false;
  }

  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) {
    return false;
  }

  const digitos = cedula.split('').map(Number);
  const digitoVerificador = digitos.pop(); // Extraemos el último dígito

  let suma = 0;

  for (let i = 0; i < digitos.length; i++) {
    let valor = digitos[i];
    if (i % 2 === 0) { // Posiciones pares (0, 2, 4, 6, 8)
      valor *= 2;
      if (valor > 9) {
        valor -= 9;
      }
    }
    suma += valor;
  }

  const verificadorCalculado = (Math.ceil(suma / 10) * 10) - suma;

  return (verificadorCalculado === 10 ? 0 : verificadorCalculado) === digitoVerificador;
}

/**
 * Valida que un correo pertenezca al dominio @espe.edu.ec
 */
export function validateEspeEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@espe\.edu\.ec$/i;
  return emailRegex.test(email);
}

/**
 * Valida que un nombre solo contenga letras, espacios y tildes/ñ.
 */
export function validateName(name: string): boolean {
  const nameRegex = /^[a-zA-Z\sñÑáéíóúÁÉÍÓÚüÜ']+$/;
  return nameRegex.test(name.trim());
}

/**
 * Valida que el ID de estudiante tenga 7 dígitos numéricos.
 */
export function validateStudentIdDigits(digits: string): boolean {
  const idRegex = /^\d{7}$/;
  return idRegex.test(digits);
}