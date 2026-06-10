import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import PhoneInput from '@/components/auth/PhoneInput';

function TestPhoneInput() {
  const [value, setValue] = React.useState('+994');

  return (
    <PhoneInput
      label="Phone"
      value={value}
      onChange={setValue}
    />
  );
}

describe('PhoneInput', () => {
  it('shows locked prefix by default and formats typed digits', () => {
    render(<TestPhoneInput />);
    const input = screen.getByLabelText('Phone') as HTMLInputElement;

    expect(input.value).toBe('+994');

    fireEvent.change(input, {
      target: {
        value: '+994501234567',
        selectionStart: 13,
      },
    });

    expect(input.value).toBe('+994 50 123 45 67');
  });

  it('normalizes pasted local numbers', () => {
    render(<TestPhoneInput />);
    const input = screen.getByLabelText('Phone') as HTMLInputElement;

    fireEvent.paste(input, {
      clipboardData: {
        getData: () => '0501234567',
      },
    });

    expect(input.value).toBe('+994 50 123 45 67');
  });
});
