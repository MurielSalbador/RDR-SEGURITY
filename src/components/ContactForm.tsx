import { useState, type FormEvent } from 'react';
import { contactSchema, SERVICE_OPTIONS, CONTACT_TIME_OPTIONS } from '../lib/schema';

type FieldErrors = Partial<Record<'name' | 'phone' | 'email' | 'serviceType' | 'contactTime' | 'message', string>>;
type Status = { type: 'idle' | 'sending' | 'ok' | 'err'; message?: string };

const initialValues = {
  name: '',
  phone: '',
  email: '',
  serviceType: '' as (typeof SERVICE_OPTIONS)[number] | '',
  contactTime: '' as (typeof CONTACT_TIME_OPTIONS)[number] | '',
  message: '',
  website: '',
};

export default function ContactForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ type: 'idle' });

  const handleChange = (field: keyof typeof values) => (e: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.currentTarget.value;
    setValues((v) => ({ ...v, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      setStatus({ type: 'idle' });
      return;
    }

    setErrors({});
    setStatus({ type: 'sending' });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({ type: 'err', message: data.error ?? 'No pudimos enviar tu consulta. Probá de nuevo en unos minutos.' });
        return;
      }

      setStatus({ type: 'ok', message: 'Consulta enviada. Te vamos a contactar a la brevedad.' });
      setValues(initialValues);
    } catch {
      setStatus({ type: 'err', message: 'Error de conexión. Revisá tu internet e intentá nuevamente.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="row2">
        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre"
            value={values.name}
            onInput={handleChange('name')}
            className={errors.name ? 'field-error' : ''}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && <span id="name-error" className="field-error-msg">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="phone">Teléfono</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Tu teléfono"
            value={values.phone}
            onInput={handleChange('phone')}
            className={errors.phone ? 'field-error' : ''}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && <span id="phone-error" className="field-error-msg">{errors.phone}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={values.email}
          onInput={handleChange('email')}
          className={errors.email ? 'field-error' : ''}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && <span id="email-error" className="field-error-msg">{errors.email}</span>}
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="serviceType">Tipo de servicio</label>
          <select
            id="serviceType"
            name="serviceType"
            value={values.serviceType}
            onInput={handleChange('serviceType')}
            className={errors.serviceType ? 'field-error' : ''}
            aria-invalid={Boolean(errors.serviceType)}
            aria-describedby={errors.serviceType ? 'serviceType-error' : undefined}
          >
            <option value="" disabled>Elegí una opción</option>
            {SERVICE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.serviceType && <span id="serviceType-error" className="field-error-msg">{errors.serviceType}</span>}
        </div>
        <div className="field">
          <label htmlFor="contactTime">Horario de contacto</label>
          <select
            id="contactTime"
            name="contactTime"
            value={values.contactTime}
            onInput={handleChange('contactTime')}
            className={errors.contactTime ? 'field-error' : ''}
            aria-invalid={Boolean(errors.contactTime)}
            aria-describedby={errors.contactTime ? 'contactTime-error' : undefined}
          >
            <option value="" disabled>Elegí un horario</option>
            {CONTACT_TIME_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.contactTime && <span id="contactTime-error" className="field-error-msg">{errors.contactTime}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="message">Mensaje</label>
        <textarea
          id="message"
          name="message"
          placeholder="Contanos brevemente qué necesitás..."
          value={values.message}
          onInput={handleChange('message')}
          className={errors.message ? 'field-error' : ''}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && <span id="message-error" className="field-error-msg">{errors.message}</span>}
      </div>

      {/* honeypot — hidden from real users, bots tend to fill every field */}
      <input
        type="text"
        name="website"
        value={values.website}
        onInput={handleChange('website')}
        tabIndex={-1}
        autoComplete="off"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        aria-hidden="true"
      />

      <button className="btn-primary" type="submit" disabled={status.type === 'sending'}>
        {status.type === 'sending' ? 'Enviando…' : 'Enviar consulta'}
      </button>
      <span className="form-note">* Tus datos se usan únicamente para responder tu consulta.</span>

      {status.type === 'ok' && <div className="form-status ok">{status.message}</div>}
      {status.type === 'err' && <div className="form-status err">{status.message}</div>}
    </form>
  );
}
