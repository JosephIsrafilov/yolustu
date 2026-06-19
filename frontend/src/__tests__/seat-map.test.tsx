import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SeatMap from '@/components/trips/SeatMap';

describe('SeatMap', () => {
  it('selects and deselects available seats', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <SeatMap
        availableSpots={['front_right', 'back_left']}
        selectedSpots={[]}
        onChange={onChange}
        language="en"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Front right' }));
    expect(onChange).toHaveBeenLastCalledWith(['front_right']);

    rerender(
      <SeatMap
        availableSpots={['front_right', 'back_left']}
        selectedSpots={['front_right']}
        onChange={onChange}
        language="en"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Front right' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('disables unavailable seats', () => {
    render(
      <SeatMap
        availableSpots={['back_left']}
        selectedSpots={[]}
        onChange={jest.fn()}
        language="en"
      />,
    );

    expect(screen.getByRole('button', { name: 'Front right' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back left' })).toBeEnabled();
  });
});
