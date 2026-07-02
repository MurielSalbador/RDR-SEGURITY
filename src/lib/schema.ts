import { z } from 'zod';

export const SERVICE_OPTIONS = [
  'Portería y control de accesos',
  'Monitoreo',
  'Patrullaje',
  'Custodio personal',
  'Otro / no estoy seguro',
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá tu nombre completo.').max(120),
  phone: z
    .string()
    .trim()
    .min(6, 'Ingresá un teléfono válido.')
    .max(30)
    .regex(/^[0-9+()\-\s]+$/, 'Usá solo números y símbolos de teléfono.'),
  email: z.string().trim().email('Ingresá un correo electrónico válido.').max(200),
  serviceType: z.enum(SERVICE_OPTIONS, { message: 'Elegí un tipo de servicio.' }),
  message: z.string().trim().min(10, 'Contanos un poco más (mínimo 10 caracteres).').max(2000),
  // honeypot field — real users never fill this in
  website: z.string().max(0, 'Campo inválido.'),
});

export type ContactInput = z.infer<typeof contactSchema>;
