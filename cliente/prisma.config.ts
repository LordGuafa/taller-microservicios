/// <reference types="node" />
import "dotenv/config";
import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";

export default definePrismaConfig({
  orm: ormConfig({
    // Add your ORM configuration here
    contract: "./prisma/contract.prisma",
    db: {
      connection: process.env["DATABASE_URL"],
    },
  }),
  skills: {
    check: false,
  },
});
