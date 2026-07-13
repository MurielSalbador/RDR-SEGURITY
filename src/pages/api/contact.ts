import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { contactSchema } from '../../lib/schema';
import { getDb } from '../../lib/mongodb';

export const prerender = false;

// En minúsculas: con el remitente de prueba onboarding@resend.dev, Resend
// compara el destinatario letra por letra contra el mail de la cuenta.
const CONTACT_TO_EMAIL = import.meta.env.CONTACT_TO_EMAIL || 'rdr.seguridadprivada@gmail.com';
const CONTACT_FROM_EMAIL = import.meta.env.CONTACT_FROM_EMAIL || 'RDR Seguridad Privada <onboarding@resend.dev>';

// Rate limit simple por IP, en memoria de la instancia serverless. No es
// perfecto (cada instancia tiene su propio contador), pero corta el spam
// básico sin depender de servicios externos.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;

  // Poda periódica para que el Map no crezca sin límite.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => t < cutoff)) hits.delete(key);
    }
  }

  const recent = (hits.get(ip) ?? []).filter((t) => t >= cutoff);
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (isRateLimited(clientAddress)) {
    return json({ error: 'Demasiados intentos. Esperá unos minutos y volvé a probar.' }, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'Datos inválidos. Revisá el formulario.' }, 422);
  }

  const { website, ...data } = parsed.data;
  if (website) {
    // Honeypot triggered — silently pretend success so bots don't learn.
    return json({ ok: true }, 200);
  }

  try {
    const db = await getDb();
    await db.collection('consultas').insertOne({
      ...data,
      createdAt: new Date(),
      source: 'landing',
    });
  } catch (err) {
    console.error('Error guardando la consulta en la base de datos', err);
    return json({ error: 'No pudimos guardar tu consulta. Intentá nuevamente en unos minutos.' }, 500);
  }

  const resendApiKey = import.meta.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: CONTACT_FROM_EMAIL,
        to: CONTACT_TO_EMAIL,
        replyTo: data.email,
        subject: `Nueva consulta — ${data.serviceType}`,
        text: [
          `Nombre: ${data.name}`,
          `Teléfono: ${data.phone}`,
          `Correo: ${data.email}`,
          `Servicio: ${data.serviceType}`,
          `Horario de contacto: ${data.contactTime}`,
          '',
          'Mensaje:',
          data.message,
        ].join('\n'),
      });
    } catch (err) {
      // La consulta ya quedó guardada en la DB, así que un fallo de mail no debe bloquear la respuesta al usuario.
      console.error('Error enviando el correo de notificación', err);
    }
  } else {
    console.warn('RESEND_API_KEY no configurada — se omitió el envío de correo.');
  }

  return json({ ok: true }, 200);
};

function json(payload: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
