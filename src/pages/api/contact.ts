import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { contactSchema } from '../../lib/schema';
import { getDb } from '../../lib/mongodb';

export const prerender = false;

const CONTACT_TO_EMAIL = import.meta.env.CONTACT_TO_EMAIL || 'Rdr.seguridadprivada@gmail.com';
const CONTACT_FROM_EMAIL = import.meta.env.CONTACT_FROM_EMAIL || 'RDR Seguridad Privada <onboarding@resend.dev>';

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Solicitud inválida.', 400);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Datos inválidos. Revisá el formulario.', 422);
  }

  const { website, ...data } = parsed.data;
  if (website) {
    // Honeypot triggered — silently pretend success so bots don't learn.
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
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
    return jsonError('No pudimos guardar tu consulta. Intentá nuevamente en unos minutos.', 500);
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

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
