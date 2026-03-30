# Skill: Database Schema (Sequelize + PostgreSQL)

## Mục tiêu
Setup Sequelize ORM với PostgreSQL, tạo migrations và models cho tất cả entities.

## Connection Setup

```typescript
// backend/src/database/connection.ts
import { Sequelize } from 'sequelize';
import config from '../config';

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: config.nodeEnv === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
```

## Schema Design

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Index Justification:**
- `UNIQUE(email)`: Đảm bảo email unique + tự động tạo index cho lookup khi login
- `INDEX(created_at)`: Hỗ trợ sorting users theo thời gian

### Campaigns Table
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sending', 'scheduled', 'sent')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
```

**Index Justification:**
- `INDEX(status)`: Filter campaigns theo status (draft, sent, etc.)
- `INDEX(created_by)`: Query campaigns của một user cụ thể (high cardinality)
- `INDEX(scheduled_at) WHERE NOT NULL`: Partial index cho scheduled campaigns, tối ưu query tìm campaigns cần gửi
- `INDEX(created_at)`: Sorting theo thời gian tạo

### Recipients Table
```sql
CREATE TABLE recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipients_email ON recipients(email);
CREATE INDEX idx_recipients_created_at ON recipients(created_at);
```

### CampaignRecipients Table
```sql
CREATE TABLE campaign_recipients (
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  PRIMARY KEY (campaign_id, recipient_id)
);

CREATE INDEX idx_cr_recipient_id ON campaign_recipients(recipient_id);
CREATE INDEX idx_cr_status ON campaign_recipients(status);
CREATE INDEX idx_cr_sent_at ON campaign_recipients(sent_at) WHERE sent_at IS NOT NULL;
```

**Index Justification:**
- `PRIMARY(campaign_id, recipient_id)`: Composite PK = unique constraint + clustered index cho query recipients của một campaign
- `INDEX(recipient_id)`: Query campaigns mà recipient thuộc về (reverse lookup)
- `INDEX(status)`: Aggregate stats theo status
- `INDEX(sent_at) WHERE NOT NULL`: Partial index, chỉ index records đã gửi

## Sequelize Models Pattern

```typescript
// Model template
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

interface CampaignAttributes {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: 'draft' | 'sending' | 'scheduled' | 'sent';
  scheduled_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface CampaignCreationAttributes extends Optional<CampaignAttributes, 'id' | 'status' | 'scheduled_at' | 'created_at' | 'updated_at'> {}

class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
  declare id: string;
  declare name: string;
  declare subject: string;
  declare body: string;
  declare status: 'draft' | 'sending' | 'scheduled' | 'sent';
  declare scheduled_at: Date | null;
  declare created_by: string;
  declare created_at: Date;
  declare updated_at: Date;
}
```

## Associations

```typescript
// models/index.ts
User.hasMany(Campaign, { foreignKey: 'created_by', as: 'campaigns' });
Campaign.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Campaign.belongsToMany(Recipient, { through: CampaignRecipient, foreignKey: 'campaign_id', as: 'recipients' });
Recipient.belongsToMany(Campaign, { through: CampaignRecipient, foreignKey: 'recipient_id', as: 'campaigns' });

Campaign.hasMany(CampaignRecipient, { foreignKey: 'campaign_id', as: 'campaignRecipients' });
Recipient.hasMany(CampaignRecipient, { foreignKey: 'recipient_id', as: 'recipientCampaigns' });
```

## Migration Pattern

```typescript
// Sử dụng sequelize-cli migration format
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', { /* ... */ });
    await queryInterface.addIndex('users', ['email'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  }
};
```

## Verification Checklist
- [ ] Database connection thành công
- [ ] Tất cả migrations chạy thành công (up)
- [ ] Tất cả migrations rollback thành công (down)
- [ ] FK constraints hoạt động (insert invalid FK → error)
- [ ] ENUM constraints hoạt động (insert invalid status → error)
- [ ] Indexes được tạo (verify với `\di` trong psql)
- [ ] Models instantiate thành công
- [ ] Associations query hoạt động (eager loading)

## Rules Applied
- Sử dụng UUID cho primary keys (không auto-increment)
- Timestamp với timezone (TIMESTAMP WITH TIME ZONE)
- Snake_case cho database columns
- Partial indexes khi có thể (WHERE clause)
- ON DELETE CASCADE cho FK relationships
- Check constraints cho ENUM-like columns
