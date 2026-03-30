import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders draft with grey styling', () => {
    render(<StatusBadge status="draft" />);
    const badge = screen.getByText('Draft');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-draft');
  });

  it('renders scheduled with blue styling', () => {
    render(<StatusBadge status="scheduled" />);
    const badge = screen.getByText('Scheduled');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-scheduled');
  });

  it('renders sent with green styling', () => {
    render(<StatusBadge status="sent" />);
    const badge = screen.getByText('Sent');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-sent');
  });

  it('renders sending with amber styling', () => {
    render(<StatusBadge status="sending" />);
    const badge = screen.getByText('Sending');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-sending');
  });
});
