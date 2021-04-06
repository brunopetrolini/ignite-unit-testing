import request from "supertest";
import { Connection, createConnection } from 'typeorm';

import { app } from "../../../../app";
import { ICreateUserDTO } from "./ICreateUserDTO";

describe("Create user controller", () => {
  const userData: ICreateUserDTO = {
    name: "Test User",
    email: "user@test.com",
    password: "test123"
  }

  let db: Connection;

  beforeAll( async () => {
    db = await createConnection();
    await db.runMigrations();
  });

  afterAll( async () => {
    await db.dropDatabase();
    await db.close();
  });

  it("Should be able to create a user", async () => {
    const response = await request(app).post("/api/v1/users").send(userData);

    expect(response.status).toBe(201);
  });

  it("Should not be able to create a user if it exists", async () => {
    const response = await request(app).post("/api/v1/users").send(userData);

    expect(response.status).toBe(400);
  });
});
