import { render, screen } from '@testing-library/react';

import AdminTableShell from '@/components/admin/AdminTableShell';

describe('AdminTableShell', () => {
  it('wraps a table without creating invalid nested table markup', () => {
    const { container } = render(
      <AdminTableShell>
        <table aria-label="Users">
          <tbody>
            <tr>
              <td>User</td>
            </tr>
          </tbody>
        </table>
      </AdminTableShell>,
    );

    expect(screen.getByRole('table', { name: 'Users' })).toBeInTheDocument();
    expect(container.querySelectorAll('table')).toHaveLength(1);
  });
});
