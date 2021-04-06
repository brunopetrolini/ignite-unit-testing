import request from "supertest"
import { Connection, createConnection } from 'typeorm';
import jwt from "jsonwebtoken"
import { v4 as uuid } from "uuid"

import authConfig from '../../../../config/auth'
import { app } from "../../../../app"
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";

describe("Create statement integration", () => {
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
    description: "Statement Description",
    type: OperationType.WITHDRAW
  }

  const userData: ICreateUserDTO = {
    name: "Admin",
    email: "admin@finapi.com.br",
    password: "master"
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

  it("Should be able to create a statement deposit", async () => {
    await request(app).post("/api/v1/users").send(userData);

    const authenticate = await request(app).post("/api/v1/sessions").send({
      email: userData.email,
      password: userData.password
    });

    const response = await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 500,
      description: statementData.description
    })
    .set({
      Authorization: `Bearer ${authenticate.body.token}`,
    });

    expect(response.body).toHaveProperty("id");
    expect(response.body.user_id).toEqual(authenticate.body.user.id);
    expect(response.body.type).toEqual(OperationType.DEPOSIT);
    expect(response.body.amount).toEqual(500);
    expect(response.body.description).toEqual(statementData.description);
  });

  it("Should not be able to create a statement it if user not exists", async () => {
    await request(app).post("/api/v1/users").send(userData);

    const { secret, expiresIn } = authConfig.jwt;

    const token = jwt.sign({ user: userData }, secret, {
      subject: uuid(),
      expiresIn
    });

    const response = await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 0,
      description: statementData.description
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(404)
  });

  it("Should be able to create a statement", async () => {
    await request(app).post("/api/v1/users").send(userData);

    const responseAuthenticate = await request(app).post("/api/v1/sessions").send({
      email: userData.email,
      password: userData.password
    });

    const response = await request(app).post("/api/v1/statements/withdraw")
    .send({
      amount: 400,
      description: statementData.description
    })
    .set({
      Authorization: `Bearer ${responseAuthenticate.body.token}`,
    });

    expect(response.body).toHaveProperty("id");
    expect(response.body.user_id).toEqual(responseAuthenticate.body.user.id);
    expect(response.body.type).toEqual(OperationType.WITHDRAW);
    expect(response.body.amount).toEqual(400);
    expect(response.body.description).toEqual(statementData.description);
  });

  it("Should not be able to create a statement it if insufficient funds", async () => {
    await request(app).post("/api/v1/users").send(userData);

    const { secret, expiresIn } = authConfig.jwt;

    const token = jwt.sign({ user: userData }, secret, {
      subject: uuid(),
      expiresIn
    });

    const response = await request(app).post("/api/v1/statements/withdwaw")
    .send({
      amount: 1000,
      description: statementData.description,
      type: OperationType.WITHDRAW
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(404);
  });
});
