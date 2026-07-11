import { z } from 'zod';

export const SERVICE_OPTIONS = [
  'Análisis técnico de seguridad',
  'Portería y control de accesos',
  'Monitoreo',
  'Patrullaje',
  'Custodio personal',
  'Otro / no estoy seguro',
] as const;

export const CONTACT_TIME_OPTIONS = [
  'Cualquier horario',
  'Por la mañana (08:00 a 12:00)',
  'Por la tarde (12:00 a 18:00)',
] as const;


export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá tu nombre completo.').max(120),
  phone: z
    .string()
    .trim()
    .min(6, 'Ingresá un teléfono válido.')
    .max(30)
    // al menos 6 dígitos, solo caracteres de teléfono
    .regex(/^(?=(?:\D*\d){6})[0-9+()\-\s]+$/, 'Ingresá un teléfono válido.'),
  email: z.string().trim().max(200).pipe(z.email('Ingresá un correo electrónico válido.')),
  serviceType: z.enum(SERVICE_OPTIONS, { message: 'Elegí un tipo de servicio.' }),
  contactTime: z.enum(CONTACT_TIME_OPTIONS, { message: 'Elegí un horario de contacto.' }),
  message: z.string().trim().min(10, 'Contanos un poco más (mínimo 10 caracteres).').max(2000),
  // honeypot field — real users never fill this in. Must PASS validation even
  // when a bot fills it, so the API can fake success instead of returning 422.
  website: z.string().max(200).optional().default(''),
});

export type ContactInput = z.infer<typeof contactSchema>;
