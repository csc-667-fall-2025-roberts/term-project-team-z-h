import { MigrationBuilder, PgType } from 'node-pg-migrate';

const TABLE_NAME = "game_results";

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createType("outcome", ["WIN", "LOSS", "DRAW"]);

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
        game_rank: {
            type: PgType.INTEGER,
            notNull: true,
        },
        outcome: {
            type: "outcome",
            notNull: true,
        },
        started_at: {
            type: PgType.TIMESTAMP,
            notNull: true,
        },
        ended_at: {
            type: PgType.TIMESTAMP,
            notNull: true,
            default: pgm.func("current_timestamp"),
        }
    });

    pgm.createIndex(TABLE_NAME, "game_id");
    pgm.createIndex(TABLE_NAME, "user_id");
    pgm.createIndex(TABLE_NAME, "ended_at");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable(TABLE_NAME);
    pgm.dropType("outcome");
}
