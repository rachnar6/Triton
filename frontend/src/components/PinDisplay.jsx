import { useState } from 'react';

export default function PinEntry({ onSubmit }) {
  const [pin, setPin] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(pin);
      }}
      style={{ display: 'flex', gap: 10, marginTop: 12 }}
    >
      <input
        type="text"
        inputMode="numeric"
        maxLength={4}
        placeholder="Enter 4-digit PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 18, letterSpacing: 4, flex: 1 }}
      />
      <button type="submit" className="btn btn-primary" disabled={pin.length !== 4}>
        Verify & Complete
      </button>
    </form>
  );
}
