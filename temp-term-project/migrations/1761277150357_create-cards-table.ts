import { MigrationBuilder, PgType } from 'node-pg-migrate';

const TABLE_NAME = "cards";

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createType("suit", ["red", "blue", "green", "yellow", "wild"]);

    pgm.createTable(TABLE_NAME, {
        id: "id",
        suit: {
            type: "suit",
            notNull: true,
        },
        value: {
            type: PgType.INTEGER,
            notNull: true,
        }
    });

    pgm.createIndex(TABLE_NAME, ["suit", "value"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable(TABLE_NAME);
    pgm.dropType("suit");
}
