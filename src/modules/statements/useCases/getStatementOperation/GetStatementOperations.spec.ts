import request from "supertest"
import { Connection, createConnection } from 'typeorm';
import jwt from "jsonwebtoken"
import { v4 as uuid } from "uuid"

import authConfig from '../../../../config/auth'
import { app } from "../../../../app"
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";

describe("Get statement operation", () => {
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

  it("Should be able to get one statement operation", async () => {
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

    const responseWithdraw = await request(app).post("/api/v1/statements/withdraw")
      .send({
        amount: 500,
        description: statementData.description
      })
      .set({
        Authorization: `Bearer ${authenticate.body.token}`,
      });

    const response = await request(app).get(`/api/v1/statements/${responseWithdraw.body.id}`)
      .set({
        Authorization: `Bearer ${authenticate.body.token}`,
      });

    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("user_id");
    expect(response.body.type).toBe(OperationType.WITHDRAW);
    expect(response.body.amount).toBe("500.00");
    expect(response.body.description).toBe(statementData.description);
  });
});
