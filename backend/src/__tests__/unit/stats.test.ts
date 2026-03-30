describe('Campaign Stats Calculation', () => {
  interface CampaignRecipient {
    status: 'pending' | 'sent' | 'failed';
    opened_at: Date | null;
  }

  function calculateStats(recipients: CampaignRecipient[]) {
    const total = recipients.length;
    const sent = recipients.filter((r) => r.status === 'sent').length;
    const failed = recipients.filter((r) => r.status === 'failed').length;
    const opened = recipients.filter((r) => r.opened_at !== null).length;

    return {
      total,
      sent,
      failed,
      opened,
      open_rate: total > 0 ? Number(((opened / total) * 100).toFixed(2)) : 0,
      send_rate: total > 0 ? Number(((sent / total) * 100).toFixed(2)) : 0,
    };
  }

  it('should return zeros for empty recipients', () => {
    const stats = calculateStats([]);
    expect(stats).toEqual({
      total: 0,
      sent: 0,
      failed: 0,
      opened: 0,
      open_rate: 0,
      send_rate: 0,
    });
  });

  it('should calculate correct send_rate', () => {
    const recipients = [
      { status: 'sent' as const, opened_at: null },
      { status: 'sent' as const, opened_at: null },
      { status: 'pending' as const, opened_at: null },
      { status: 'failed' as const, opened_at: null },
    ];
    const stats = calculateStats(recipients);
    expect(stats.send_rate).toBe(50);
  });

  it('should calculate correct open_rate', () => {
    const recipients = [
      { status: 'sent' as const, opened_at: new Date() },
      { status: 'sent' as const, opened_at: new Date() },
      { status: 'sent' as const, opened_at: null },
    ];
    const stats = calculateStats(recipients);
    expect(stats.open_rate).toBe(66.67);
  });

  it('should handle all sent recipients', () => {
    const recipients = [
      { status: 'sent' as const, opened_at: null },
      { status: 'sent' as const, opened_at: null },
    ];
    const stats = calculateStats(recipients);
    expect(stats.send_rate).toBe(100);
    expect(stats.open_rate).toBe(0);
  });

  it('should handle all failed recipients', () => {
    const recipients = [
      { status: 'failed' as const, opened_at: null },
      { status: 'failed' as const, opened_at: null },
    ];
    const stats = calculateStats(recipients);
    expect(stats.send_rate).toBe(0);
  });

  it('should handle mixed sent/failed/pending', () => {
    const recipients = [
      { status: 'sent' as const, opened_at: new Date() },
      { status: 'sent' as const, opened_at: null },
      { status: 'failed' as const, opened_at: null },
      { status: 'pending' as const, opened_at: null },
    ];
    const stats = calculateStats(recipients);
    expect(stats.total).toBe(4);
    expect(stats.sent).toBe(2);
    expect(stats.failed).toBe(1);
    expect(stats.opened).toBe(1);
    expect(stats.send_rate).toBe(50);
    expect(stats.open_rate).toBe(25);
  });

  it('should handle division by zero (0 total)', () => {
    const stats = calculateStats([]);
    expect(stats.open_rate).toBe(0);
    expect(stats.send_rate).toBe(0);
  });

  it('should round rates to 2 decimal places', () => {
    const recipients = [
      { status: 'sent' as const, opened_at: new Date() },
      { status: 'sent' as const, opened_at: new Date() },
      { status: 'sent' as const, opened_at: new Date() },
    ];
    const stats = calculateStats(recipients);
    expect(stats.open_rate).toBe(100);
    expect(stats.send_rate).toBe(100);
  });
});
