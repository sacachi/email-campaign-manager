import { Request, Response, NextFunction } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Recipient, CampaignRecipient } from '../models';
import { AppError } from '../utils/errors';

export async function listRecipients(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: recipients } = await Recipient.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    // Enrich with send stats
    const recipientIds = recipients.map((r) => r.id);
    const stats = recipientIds.length > 0
      ? await CampaignRecipient.findAll({
          where: { recipient_id: { [Op.in]: recipientIds } },
          attributes: [
            'recipient_id',
            [fn('COUNT', literal("CASE WHEN status = 'sent' THEN 1 END")), 'send_count'],
            [fn('MAX', col('sent_at')), 'last_sent_at'],
          ],
          group: ['recipient_id'],
          raw: true,
        })
      : [];

    const statsMap = new Map(
      (stats as any[]).map((s) => [s.recipient_id, { send_count: Number(s.send_count) || 0, last_sent_at: s.last_sent_at }])
    );

    const enriched = recipients.map((r) => {
      const s = statsMap.get(r.id);
      return {
        ...r.toJSON(),
        send_count: s?.send_count || 0,
        last_sent_at: s?.last_sent_at || null,
      };
    });

    res.json({
      data: enriched,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecipientById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const recipient = await Recipient.findByPk(id);
    if (!recipient) {
      throw new AppError('Recipient not found', 404);
    }

    res.json({ data: recipient });
  } catch (error) {
    next(error);
  }
}

export async function updateRecipient(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { email, name } = req.body;

    const recipient = await Recipient.findByPk(id);
    if (!recipient) {
      throw new AppError('Recipient not found', 404);
    }

    if (email && email !== recipient.email) {
      const existing = await Recipient.findOne({ where: { email } });
      if (existing) {
        throw new AppError('Email already registered', 409);
      }
    }

    await recipient.update({ email, name });

    res.json({ data: recipient });
  } catch (error) {
    next(error);
  }
}

export async function deleteRecipient(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const recipient = await Recipient.findByPk(id);
    if (!recipient) {
      throw new AppError('Recipient not found', 404);
    }

    await recipient.destroy();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function createRecipient(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, name } = req.body;

    const existing = await Recipient.findOne({ where: { email } });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const recipient = await Recipient.create({ email, name });

    res.status(201).json({ data: recipient });
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateRecipients(req: Request, res: Response, next: NextFunction) {
  try {
    const { recipients } = req.body;

    const emails = recipients.map((r: { email: string }) => r.email.toLowerCase());

    // Deduplicate within the incoming request (keep last occurrence per email)
    const uniqueByEmail = new Map<string, { email: string; name: string }>();
    for (const r of recipients) {
      uniqueByEmail.set(r.email.toLowerCase(), r);
    }
    const deduped = Array.from(uniqueByEmail.values());

    const existing = await Recipient.findAll({
      where: { email: { [Op.in]: emails } },
      attributes: ['email'],
    });
    const existingEmails = new Set(existing.map((r) => r.email.toLowerCase()));

    const toCreate = deduped.filter(
      (r: { email: string }) => !existingEmails.has(r.email.toLowerCase())
    );

    const created = toCreate.length > 0
      ? await Recipient.bulkCreate(toCreate, { validate: true })
      : [];

    res.status(201).json({
      data: {
        created: created.length,
        skipped: recipients.length - created.length,
        recipients: created,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function bulkDeleteRecipients(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;

    const deleted = await Recipient.destroy({
      where: { id: { [Op.in]: ids } },
    });

    res.json({ data: { deleted } });
  } catch (error) {
    next(error);
  }
}

export async function exportRecipients(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;

    const where = ids && ids.length > 0 ? { id: { [Op.in]: ids } } : {};
    const recipients = await Recipient.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    // Enrich with stats
    const recipientIds = recipients.map((r) => r.id);
    const stats = recipientIds.length > 0
      ? await CampaignRecipient.findAll({
          where: { recipient_id: { [Op.in]: recipientIds } },
          attributes: [
            'recipient_id',
            [fn('COUNT', literal("CASE WHEN status = 'sent' THEN 1 END")), 'send_count'],
            [fn('MAX', col('sent_at')), 'last_sent_at'],
          ],
          group: ['recipient_id'],
          raw: true,
        })
      : [];

    const statsMap = new Map(
      (stats as any[]).map((s) => [s.recipient_id, { send_count: Number(s.send_count) || 0, last_sent_at: s.last_sent_at }])
    );

    const csv = ['Email,Name,Send Count,Last Sent,Created'];
    for (const r of recipients) {
      const s = statsMap.get(r.id);
      csv.push(
        `"${r.email}","${r.name}",${s?.send_count || 0},"${s?.last_sent_at ? new Date(s.last_sent_at).toISOString() : ''}","${new Date(r.created_at).toISOString()}"`
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=recipients.csv');
    res.send(csv.join('\n'));
  } catch (error) {
    next(error);
  }
}
