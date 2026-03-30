/**
 * Unit tests for BullMQ scheduler logic.
 *
 * Strategy: mock the queue module and Campaign model — no Redis or DB needed.
 * We verify that:
 *   - overdue scheduled campaigns are enqueued immediately
 *   - future scheduled campaigns are delayed to the correct timestamp
 *   - campaigns already in the queue are not re-enqueued
 *   - campaigns with status other than 'scheduled' are ignored
 */

jest.mock('../../jobs/queue', () => ({
  enqueueCampaignSend: jest.fn().mockResolvedValue(undefined),
  scheduleCampaignSend: jest.fn().mockResolvedValue(undefined),
  campaignQueue: {
    getJob: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../../models', () => ({
  Campaign: {
    findAll: jest.fn(),
  },
}));

import { enqueueCampaignSend, scheduleCampaignSend, campaignQueue } from '../../jobs/queue';
import { Campaign } from '../../models';

// Re-import after mocks are set up
// We test the internal sync logic by extracting it, so we invoke startScheduler
// and assert side-effects on the mocked queue functions.
import { startScheduler } from '../../jobs/scheduler';

const mockEnqueue = enqueueCampaignSend as jest.Mock;
const mockSchedule = scheduleCampaignSend as jest.Mock;
const mockGetJob = (campaignQueue.getJob as jest.Mock);
const mockFindAll = (Campaign.findAll as jest.Mock);

beforeEach(() => {
  jest.clearAllMocks();
  mockGetJob.mockResolvedValue(null); // default: job does not exist yet
});

describe('Scheduler — syncScheduledCampaigns', () => {
  it('enqueues immediately when scheduled_at is in the past (overdue)', async () => {
    const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
    mockFindAll.mockResolvedValue([
      { id: 'camp-1', name: 'Overdue Campaign', scheduled_at: pastDate },
    ]);

    await startScheduler();

    expect(mockEnqueue).toHaveBeenCalledTimes(1);
    expect(mockEnqueue).toHaveBeenCalledWith('camp-1');
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('enqueues immediately when scheduled_at is null (no date set)', async () => {
    mockFindAll.mockResolvedValue([
      { id: 'camp-2', name: 'Null Date Campaign', scheduled_at: null },
    ]);

    await startScheduler();

    expect(mockEnqueue).toHaveBeenCalledTimes(1);
    expect(mockEnqueue).toHaveBeenCalledWith('camp-2');
  });

  it('schedules with delay when scheduled_at is in the future', async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes ahead
    mockFindAll.mockResolvedValue([
      { id: 'camp-3', name: 'Future Campaign', scheduled_at: futureDate },
    ]);

    await startScheduler();

    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(mockSchedule).toHaveBeenCalledWith('camp-3', futureDate);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it('skips a campaign that is already queued', async () => {
    const futureDate = new Date(Date.now() + 5 * 60 * 1000);
    mockFindAll.mockResolvedValue([
      { id: 'camp-4', name: 'Already Queued', scheduled_at: futureDate },
    ]);
    // Simulate the job already existing in Redis
    mockGetJob.mockResolvedValue({ id: 'campaign-camp-4' });

    await startScheduler();

    expect(mockEnqueue).not.toHaveBeenCalled();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('handles a mix of overdue and future campaigns', async () => {
    const past = new Date(Date.now() - 30 * 60 * 1000);
    const future = new Date(Date.now() + 30 * 60 * 1000);

    mockFindAll.mockResolvedValue([
      { id: 'camp-overdue', name: 'Overdue', scheduled_at: past },
      { id: 'camp-future', name: 'Future', scheduled_at: future },
    ]);

    await startScheduler();

    expect(mockEnqueue).toHaveBeenCalledTimes(1);
    expect(mockEnqueue).toHaveBeenCalledWith('camp-overdue');
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(mockSchedule).toHaveBeenCalledWith('camp-future', future);
  });

  it('does nothing when there are no scheduled campaigns', async () => {
    mockFindAll.mockResolvedValue([]);

    await startScheduler();

    expect(mockEnqueue).not.toHaveBeenCalled();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('queries only campaigns with status=scheduled', async () => {
    mockFindAll.mockResolvedValue([]);

    await startScheduler();

    const callArgs = mockFindAll.mock.calls[0][0];
    expect(callArgs.where).toMatchObject({ status: 'scheduled' });
  });
});
