import { MigrationBuilder, PgType } from 'node-pg-migrate';

const TABLE_NAME = "game_cards";

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable(TABLE_NAME, {
        id: "id",
        game_id: {
            type: PgType.INTEGER,
            notNull: true,
            references: "games(id)",
            onDelete: "CASCADE",
        },
        card_id: {
            type: PgType.INTEGER,
            notNull: true,
            references: "cards(id)",
            onDelete: "CASCADE",
        },
        participant_id: {
            type: PgType.INTEGER,
            notNull: false,
            references: "participants(id)",
            onDelete: "CASCADE",
        },
        card_order: {
            type: PgType.INTEGER,
            notNull: false,
        },
        location: {
            type: PgType.VARCHAR + "(50)",
            notNull: true,
            default: "'deck'",
        }
    });

    pgm.createIndex(TABLE_NAME, "game_id");
    pgm.createIndex(TABLE_NAME, "participant_id");
    pgm.createIndex(TABLE_NAME, ["game_id", "location"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable(TABLE_NAME);
}
