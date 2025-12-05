import { MigrationBuilder, PgType } from 'node-pg-migrate';

const TABLE_NAME = "game_players";

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable(TABLE_NAME, {
        id: "id",
        game_id: {
            type: PgType.INTEGER,
            notNull: true,
            references: "games(id)",
            onDelete: "CASCADE",
        },
        user_id: {
            type: PgType.INTEGER,
            notNull: true,
            references: "users(id)",
            onDelete: "CASCADE",
        },
        joined_at: {
            type: PgType.TIMESTAMP,
            notNull: true,
            default: pgm.func("current_timestamp"),
        }
    });

    pgm.createIndex(TABLE_NAME, ["game_id", "user_id"], { unique: true });
    pgm.createIndex(TABLE_NAME, "game_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable(TABLE_NAME);
}
