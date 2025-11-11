import { configDotenv } from "dotenv";
import pgPromise from "pg-promise";

configDotenv();

const connectionString = process.env.DATABASE_URL;
if(connectionString === undefined){
    throw "Connection string undefinedl terminating server start up";
}

const db = pgPromise()(connectionString)

export default db;

