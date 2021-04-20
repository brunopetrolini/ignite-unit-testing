import request from "supertest";

import { Connection, createConnection } from "typeorm";

import { app } from "../../../../app";

import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";

describe("Create Transfer Controller", () => {
  enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
  }

  interface ICreateStatementDTO {
    user_id: string;
    amount: number;
    description: string;
    type: OperationType;
  }

  const statementData: ICreateStatementDTO = {
    user_id: "",
    amount: 0,
    description: "Test Statement",
    type: OperationType.DEPOSIT,
  }

  const userDataSender: ICreateUserDTO = {
    name: "User Sender",
    email: "sender@mail.com",
    password: "pass123",
  }

  const userDataReceiver: ICreateUserDTO = {
    name: "User Receiver",
    email: "receiver@mail.com",
    password: "pass123",
  }

  let db: Connection;

  beforeAll( async() => {
    db = await createConnection();
    await db.runMigrations();
  })

  afterAll(async () => {
    await db.dropDatabase();
    await db.close();
  });

  it("Should be able to create a transfer", async () => {

    await request(app).post("/api/v1/users").send(userDataSender);
    await request(app).post("/api/v1/users").send(userDataReceiver);

    const userSenderAuth = await request(app).post("/api/v1/sessions").send({
      email: userDataSender.email,
      password: userDataSender.password,
    });

    const token = userSenderAuth.body.token;

    const userReceiverAuth = await request(app).post("/api/v1/sessions").send({
      email: userDataReceiver.email,
      password: userDataReceiver.password,
    });

    await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 530,
      description: statementData.description,
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    const transfer = await request(app).post(`/api/v1/statements/transfer/${userReceiverAuth.body.user.id}`).send({
      amount: 70,
      description: "Transfer Test",
    }).set({
      Authorization: `Bearer ${token}`,
    });

    const balance = await request(app).get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${userSenderAuth.body.token}`,
      });

    expect(transfer.body.amount).toEqual(50);
    expect(transfer.body.description).toEqual("Transfer Test");
    expect(transfer.body).toHaveProperty("id");
    expect(transfer.body).toHaveProperty("sender_id");
    expect(transfer.body).toHaveProperty("transfer_id");
    expect(balance.body.balance).toEqual(460);
  });

  it("Should not be able to create a transfer if the user does not have enough funds", async () => {
    await request(app).post("/api/v1/users").send(userDataSender);
    await request(app).post("/api/v1/users").send(userDataReceiver);

    const userSenderAuth = await request(app).post("/api/v1/sessions").send({
      email: userDataSender.email,
      password: userDataSender.password,
    });

    const token = userSenderAuth.body.token;

    const userReceiverAuth = await request(app).post("/api/v1/sessions").send({
      email: userDataReceiver.email,
      password: userDataReceiver.password,
    });

    const response = await request(app).post(`/api/v1/statements/transfer/${userReceiverAuth.body.user.id}`).send({
      amount: 3000,
      description: "Transfer Test",
    }).set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.body.message).toEqual('Insufficient funds');
  });
});
