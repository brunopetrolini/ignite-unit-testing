import request from "supertest"
import { Connection, createConnection } from 'typeorm';
import jwt from "jsonwebtoken"
import { v4 as uuid } from "uuid"

import authConfig from '../../../../config/auth'
import { app } from "../../../../app"
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";

describe("Get balance controller", () => {
  enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
  }

  interface ICreateStatementDTO {
    user_id: string;
    amount: number;
    description: string;
    type: OperationType
  }

  const statementData: ICreateStatementDTO = {
    user_id: "",
    amount: 0,
    description: "Statement Test",
    type: OperationType.WITHDRAW
  }

  const userData: ICreateUserDTO = {
    name: "Test Admin",
    email: "admin@test.com",
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

  it("Must be able to get balance using the user ID", async () => {
    await request(app).post("/api/v1/users").send(userData);

    const authenticate = await request(app).post("/api/v1/sessions").send({
      email: userData.email,
      password: userData.password
    });

    await request(app).post("/api/v1/statements/deposit")
      .send({
        amount: 900,
        description: statementData.description
      })
      .set({
        Authorization: `Bearer ${authenticate.body.token}`,
      });

    await request(app).post("/api/v1/statements/withdraw")
      .send({
        amount: 500,
        description: statementData.description
      })
      .set({
        Authorization: `Bearer ${authenticate.body.token}`,
      });

    const response = await request(app).get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${authenticate.body.token}`,
      });

    expect(response.body.statement).toHaveLength(2);
    expect(response.body.balance).toBe(400);
  });

  it("Should not be able to get balance if it user not exists", async () => {
    await request(app).post("/api/v1/users").send(userData);

    const { secret, expiresIn } = authConfig.jwt;

    const token = jwt.sign({ user: userData }, secret, {
      subject: uuid(),
      expiresIn
    });

    const response = await request(app).get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(404);
  });
});
