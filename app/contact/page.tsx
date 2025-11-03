'use client';
import { useState } from 'react';

export default function ContactForm() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    const formData = {
      to: 'ogbechiemicheal@gmail.com', 
      subject: 'Contact Form Submission',
      html: `
        <html>
          <body>
            <h1>New Message</h1>
            <p><strong>Message:</strong> ${message}</p>
          </body>
        </html>
      `,
      text: `New Message: ${message}`, // Plain text fallback
    };

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('Email sent successfully!');
        setMessage('');
      } else {
        setStatus('Failed to send email.');
      }
    } catch (error) {
      setStatus('Error occurred.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your message"
        required
        rows={5}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Email'}
      </button>
      {status && <p>{status}</p>}
    </form>
  );
}