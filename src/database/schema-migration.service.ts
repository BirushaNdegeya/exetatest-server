import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/sequelize';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';
import { findSectionMatchingLegacyLabel } from '../sections/section-legacy-match.util';
import { DRC_SECTIONS } from '../sections/drc-sections.constants';

interface DbSectionRow {
  id: string;
  name: string;
}

@Injectable()
export class SchemaMigrationService implements OnModuleInit {
  private readonly logger = new Logger(SchemaMigrationService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async onModuleInit(): Promise<void> {
    const runStartupMigrations = this.getBooleanEnv(
      'RUN_STARTUP_MIGRATIONS',
      true,
    );
    if (!runStartupMigrations) {
      this.logger.log(
        'Skipping startup schema migrations because RUN_STARTUP_MIGRATIONS=false',
      );
      return;
    }

    await this.consolidateUserRelatedTables();
    await this.migrateSectionsTableToStaticCatalog();

    const runStartupBackfills = this.getBooleanEnv(
      'RUN_STARTUP_BACKFILLS',
      false,
    );
    if (!runStartupBackfills) {
      this.logger.log(
        'Skipping startup data backfills; set RUN_STARTUP_BACKFILLS=true to enable them',
      );
      return;
    }

    await this.backfillUsersLegacySectionTextToIds();
  }

  private getBooleanEnv(name: string, fallback: boolean): boolean {
    const value = this.configService.get<string>(name);
    if (value === undefined) {
      return fallback;
    }

    return value === 'true';
  }

  /**
   * Merges profiles, user_roles, and user_streaks into the users table, then drops legacy tables.
   */
  private async consolidateUserRelatedTables(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();

    try {
      const userTable = await queryInterface.describeTable('users');

      const addColumnIfMissing = async (
        column: string,
        definition: Parameters<typeof queryInterface.addColumn>[2],
      ): Promise<void> => {
        if (!userTable[column]) {
          await queryInterface.addColumn('users', column, definition);
          this.logger.log(`Added users.${column} column`);
        }
      };

      await addColumnIfMissing('country', {
        type: DataTypes.STRING(100),
        allowNull: true,
      });
      await addColumnIfMissing('region', {
        type: DataTypes.STRING(100),
        allowNull: true,
      });

      if (userTable.pays && userTable.country) {
        await this.sequelize.query(`
          UPDATE users
          SET country = COALESCE(country, pays)
          WHERE pays IS NOT NULL AND TRIM(pays) <> ''
        `);
        this.logger.log('Migrated users.pays into users.country');
      }

      if (userTable.province && userTable.region) {
        await this.sequelize.query(`
          UPDATE users
          SET region = COALESCE(region, province)
          WHERE province IS NOT NULL AND TRIM(province) <> ''
        `);
        this.logger.log('Migrated users.province into users.region');
      }
      await addColumnIfMissing('role', {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'user',
      });
      await addColumnIfMissing('section', {
        type: DataTypes.STRING,
        allowNull: true,
      });
      await addColumnIfMissing('section_id', {
        type: DataTypes.STRING(64),
        allowNull: true,
      });
      await addColumnIfMissing('current_streak', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
      await addColumnIfMissing('longest_streak', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
      await addColumnIfMissing('last_activity_date', {
        type: DataTypes.DATEONLY,
        allowNull: true,
      });
      await addColumnIfMissing('last_inactivity_email_sent_at', {
        type: DataTypes.DATE,
        allowNull: true,
      });

      let profilesTable: Record<string, unknown> | null = null;
      try {
        profilesTable = await queryInterface.describeTable('profiles');
      } catch {
        profilesTable = null;
      }

      if (profilesTable) {
        await this.sequelize.query(`
          UPDATE users u
          SET
            section_id = COALESCE(u.section_id, p.section_id),
            section = COALESCE(u.section, p.section)
          FROM profiles p
          WHERE p."userId" = u.id
        `);
        this.logger.log('Migrated profile section fields into users');
      }

      let userRolesTable: Record<string, unknown> | null = null;
      try {
        userRolesTable = await queryInterface.describeTable('user_roles');
      } catch {
        userRolesTable = null;
      }

      if (userRolesTable) {
        await this.sequelize.query(`
          UPDATE users u
          SET role = 'admin'
          FROM user_roles ur
          WHERE ur."userId" = u.id
            AND ur.role = 'admin'
        `);
        this.logger.log('Migrated admin roles into users.role');
      }

      let userStreaksTable: Record<string, unknown> | null = null;
      try {
        userStreaksTable = await queryInterface.describeTable('user_streaks');
      } catch {
        userStreaksTable = null;
      }

      if (userStreaksTable) {
        await this.sequelize.query(`
          UPDATE users u
          SET
            current_streak = COALESCE(us.current_streak, u.current_streak, 0),
            longest_streak = COALESCE(us.longest_streak, u.longest_streak, 0),
            last_activity_date = COALESCE(us.last_activity_date, u.last_activity_date),
            last_inactivity_email_sent_at = COALESCE(
              us.last_inactivity_email_sent_at,
              u.last_inactivity_email_sent_at
            )
          FROM user_streaks us
          WHERE us."userId" = u.id
        `);
        this.logger.log('Migrated streak fields into users');
      }

      for (const legacyTable of ['profiles', 'user_roles', 'user_streaks']) {
        try {
          await queryInterface.dropTable(legacyTable);
          this.logger.log(`Dropped legacy table ${legacyTable}`);
        } catch {
          // Table may already be absent.
        }
      }
    } catch (e) {
      this.logger.warn(
        `consolidateUserRelatedTables skipped: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  /**
   * Replaces the old `sections` table with the in-code DRC catalog:
   * maps UUID FKs to catalog slugs on users, drops FKs, and removes the table.
   */
  private async migrateSectionsTableToStaticCatalog(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    let sectionsTable: Record<string, unknown> | null = null;

    try {
      sectionsTable = await queryInterface.describeTable('sections');
    } catch {
      await this.ensureUserSectionIdColumnIsStringSlug();
      return;
    }

    if (!sectionsTable) {
      return;
    }

    try {
      const dbSections = await this.sequelize.query<DbSectionRow>(
        'SELECT id, name FROM sections',
        { type: QueryTypes.SELECT },
      );

      const catalog = DRC_SECTIONS.map((section) => ({
        id: section.id,
        title: section.title,
      }));

      for (const row of dbSections) {
        const match = findSectionMatchingLegacyLabel(row.name, catalog);
        if (!match) {
          this.logger.warn(
            `No DRC catalog match for legacy section "${row.name}" (${row.id})`,
          );
          continue;
        }

        await this.sequelize.query(
          `UPDATE users SET section_id = :slug, section = :title WHERE section_id::text = :oldId`,
          {
            replacements: {
              slug: match.id,
              title: match.title,
              oldId: row.id,
            },
          },
        );
      }

      await this.ensureUserSectionIdColumnIsStringSlug();
      await queryInterface.dropTable('sections');
      this.logger.log(
        'Dropped sections table; section_id now uses DRC catalog slugs',
      );
    } catch (e) {
      this.logger.warn(
        `migrateSectionsTableToStaticCatalog skipped: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  private async ensureUserSectionIdColumnIsStringSlug(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();

    try {
      const described = await queryInterface.describeTable('users');
      const column = described.section_id;
      if (!column) {
        return;
      }

      const typeKey = String(column.type);
      if (!typeKey.includes('uuid') && !typeKey.includes('UUID')) {
        return;
      }

      await queryInterface.changeColumn('users', 'section_id', {
        type: DataTypes.STRING(64),
        allowNull: true,
      });
      this.logger.log('Converted users.section_id to VARCHAR(64) slug');
    } catch (e) {
      this.logger.warn(
        `ensureUserSectionIdColumnIsStringSlug skipped: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  /** Links users.section_id from legacy users.section when labels match the catalog. */
  private async backfillUsersLegacySectionTextToIds(): Promise<void> {
    try {
      const catalog = DRC_SECTIONS.map((section) => ({
        id: section.id,
        title: section.title,
      }));

      const users = await this.sequelize.query<{
        id: string;
        section: string;
      }>(
        `SELECT id, section FROM users WHERE section_id IS NULL AND section IS NOT NULL AND TRIM(section) <> ''`,
        { type: QueryTypes.SELECT },
      );

      let updated = 0;
      for (const user of users) {
        const match = findSectionMatchingLegacyLabel(user.section, catalog);
        if (match) {
          await this.sequelize.query(
            `UPDATE users SET section_id = :sid, section = :stitle WHERE id = :uid`,
            {
              replacements: {
                sid: match.id,
                stitle: match.title,
                uid: user.id,
              },
            },
          );
          updated += 1;
        }
      }
      if (updated > 0) {
        this.logger.log(
          `Backfilled section_id on ${updated} user row(s) from legacy section text`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `backfillUsersLegacySectionTextToIds skipped: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
