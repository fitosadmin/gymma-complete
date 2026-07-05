import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { resolve } from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this._ensureFitosSchema();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Auto-initialises fitos-specific tables on first boot so the app works
  // regardless of what start command Render (or any other host) uses.
  // After the first successful run this check costs ~1ms and is a no-op.
  private async _ensureFitosSchema(): Promise<void> {
    try {
      await this.$queryRaw`SELECT 1 FROM "workout_plans" LIMIT 1`;
      return; // tables already exist
    } catch {
      this.logger.log('Fitos tables not found — running schema init (first boot)...');
    }

    // Root of the fitos/backend package at runtime:
    // compiled file lives at dist/src/prisma/prisma.service.js → 3 levels up
    const root = resolve(__dirname, '..', '..', '..');
    const opts = { stdio: 'inherit' as const, env: process.env, cwd: root };

    try {
      execSync('npx prisma db push --skip-generate', opts);
      this.logger.log('Schema applied.');
    } catch (err: any) {
      this.logger.error('prisma db push failed — app may be unstable:', err?.message);
      return;
    }

    try {
      execSync('npx ts-node --transpile-only prisma/seed.ts', opts);
      this.logger.log('Seed complete.');
    } catch (err: any) {
      this.logger.error('Seed failed (exercises may be missing):', err?.message);
    }
  }
}
