import { MigrationBuilder, PgType } from 'node-pg-migrate';

const TABLE_NAME = "profile";

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable(TABLE_NAME, {
        id: "id",
        user_id: {
            type: PgType.INTEGER,
            notNull: true,
            unique: true,
            references: "users(id)",
            onDelete: "CASCADE",
        },
        bio: {
            type: PgType.TEXT,
            notNull: false,
        },
        updated_at: {
            type: PgType.TIMESTAMP,
            notNull: true,
            default: pgm.func("current_timestamp"),
        }
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable(TABLE_NAME);
}
