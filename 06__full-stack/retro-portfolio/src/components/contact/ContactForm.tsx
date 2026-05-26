// src/components/contact/ContactForm.tsx
import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

// ── Types ─────────────────────────────────────────────────────────
type FormState = 'idle' | 'sending' | 'success' | 'error'

interface FormData {
  name:    string
  email:   string
  subject: string
  message: string
}

interface FieldError {
  name?:    string
  email?:   string
  subject?: string
  message?: string
}

// ── Validation ────────────────────────────────────────────────────
function validate(data: FormData): FieldError {
  const errors: FieldError = {}
  if (!data.name.trim())                        errors.name    = 'Name is required'
  if (!data.email.trim())                       errors.email   = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
                                                errors.email   = 'Invalid email address'
  if (!data.subject.trim())                     errors.subject = 'Subject is required'
  if (data.message.trim().length < 20)          errors.message = 'Message must be at least 20 characters'
  return errors
}

// ── Form field ────────────────────────────────────────────────────
interface FieldProps {
  label:       string
  id:          string
  type?:       string
  placeholder: string
  value:       string
  error?:      string
  textarea?:   boolean
  onChange:    (val: string) => void
}

function Field({ label, id, type = 'text', placeholder, value, error, textarea, onChange }: FieldProps) {
  const inputClass = `
    w-full font-mono text-[14px] sm:text-[15px] text-[#f0ede6]
    bg-[#111] border px-3 py-3 outline-none
    placeholder:text-[#555] placeholder:opacity-100
    transition-colors duration-150
    focus:ring-1 focus:ring-[#c8f135]/40 focus:ring-offset-0
    ${error
      ? 'border-[#e63222]'
      : 'border-[#2a2a2a] focus:border-[#c8f135] focus:bg-[#0f0f0f]'}
  `

  return (
    <div className="form-field mb-8">
      <label
        htmlFor={id}
        className="block text-[11px] sm:text-[12px] tracking-[2.5px] text-[#c8f135] uppercase font-mono mb-2.5"
      >
        {label}
        <span className="text-[#c8f135] ml-1" aria-hidden="true">*</span>
      </label>

      {textarea ? (
        <textarea
          id={id}
          rows={5}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} resize-none`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      )}

      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-[10px] text-[#e63222] font-mono tracking-[1px]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function ContactForm() {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const formRef      = useRef<HTMLFormElement>(null)

  // State
  const [formData, setFormData] = useState<FormData>({
    name: '', email: '', subject: '', message: '',
  })
  const [errors,    setErrors]    = useState<FieldError>({})
  const [formState, setFormState] = useState<FormState>('idle')

  // ── GSAP scroll entrance ────────────────────────────────────────
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)
    if (!formRef.current) return

    gsap.from(formRef.current.querySelectorAll('.form-field'), {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        once: true,
      },
    })
  }, { scope: containerRef, dependencies: [] })

  // ── Field updater ───────────────────────────────────────────────
  const set = (field: keyof FormData) => (val: string) => {
    setFormData((p) => ({ ...p, [field]: val }))
    // Clear error on change
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }))
  }

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errs = validate(formData)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // Shake the form
      gsap.from(formRef.current, {
        x: 6,
        duration: 0.07,
        repeat: 5,
        yoyo: true,
        ease: 'none',
      })
      return
    }

    setFormState('sending')

    try {
      // Formspree form 
      const res = await fetch('https://formspree.io/f/mpqnjbeb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setFormState('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        setFormState('error')
      }
    } catch {
      setFormState('error')
    }
  }

  // ── Success state ────────────────────────────────────────────────
  if (formState === 'success') {
    return (
      <div
        ref={containerRef}
        className="section-x py-8 md:py-12 flex flex-col items-start justify-center min-h-[280px] md:min-h-[400px]"
      >
        <span
          className="text-[64px] text-[#c8f135] leading-none mb-6"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          aria-hidden="true"
        >
          ✓
        </span>
        <h3
          className="text-[32px] text-[#f0ede6] leading-none mb-4"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          Message Sent.
        </h3>
        <p className="text-[12px] text-[#555] font-mono leading-[1.8] max-w-[320px] mb-8">
          Thanks for reaching out. I'll get back to you within 24–48 hours.
        </p>
        <button
          onClick={() => setFormState('idle')}
          className="
            text-[11px] tracking-[2px] uppercase font-mono
            text-[#555] hover:text-[#c8f135]
            bg-transparent border-none cursor-pointer
            transition-colors duration-150
          "
        >
          ← Send another message
        </button>
      </div>
    )
  }

  // ── Default form state ───────────────────────────────────────────
  return (
    <div ref={containerRef} className="px-12 py-12">
      <p className="text-[10px] tracking-[3px] text-[#666] uppercase font-mono mb-8">
        // Send a message
      </p>

      <form
        ref={formRef}
        onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
        noValidate
        aria-label="Contact form"
      >
        {/* Row: name + email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8">
          <Field
            label="Name" id="name" placeholder="Shaharyar Shakir"
            value={formData.name} error={errors.name} onChange={set('name')}
          />
          <Field
            label="Email" id="email" type="email" placeholder="you@company.com"
            value={formData.email} error={errors.email} onChange={set('email')}
          />
        </div>

        <Field
          label="Subject" id="subject"
          placeholder="DevOps consulting / Full-time role / Open source..."
          value={formData.subject} error={errors.subject} onChange={set('subject')}
        />

        <Field
          label="Message" id="message" textarea
          placeholder="Tell me about the project, role, or idea..."
          value={formData.message} error={errors.message} onChange={set('message')}
        />

        {/* Error banner */}
        {formState === 'error' && (
          <p className="mb-4 text-[11px] text-[#e63222] font-mono tracking-[1px] border border-[#e63222]/30 px-3 py-2" role="alert">
            Something went wrong. Try emailing me directly instead.
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={formState === 'sending'}
          className="
            w-full py-3.5 mt-2
            text-[11px] tracking-[2px] uppercase font-mono
            border transition-all duration-150 cursor-pointer
            disabled:opacity-40 disabled:cursor-not-allowed
            bg-[#c8f135] text-[#0a0a0a] border-[#c8f135]
            hover:bg-transparent hover:text-[#c8f135]
          "
        >
          {formState === 'sending' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              Sending...
            </span>
          ) : (
            'Send Message →'
          )}
        </button>

        <p className="mt-6 text-[12px] text-[#666] font-mono text-center font-semibold  pt-2">
          Or email directly:{' '}
          <a
            href="mailto:shakirshaharyar125@gmail.com"
            className="text-[#666] hover:text-[#c8f135] transition-colors duration-150 underline underline-offset-2"
          >
            shakirshaharyar125@gmail.com
          </a>
        </p>
      </form>
    </div>
  )
}