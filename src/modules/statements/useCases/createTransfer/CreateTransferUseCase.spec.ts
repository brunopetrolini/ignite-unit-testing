import { AppError } from "../../../../shared/errors/AppError"
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository"
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase"
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO"
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository"
import { InMemoryTransfersRepository } from "../../repositories/in-memory/InMemoryTransferRepository"
import { CreateTransferUseCase } from "./CreateTransferUseCase"

describe("Create Transfer Use Case", () => {
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
    description: "Statement Test",
    type: OperationType.DEPOSIT,
  }

  const userDataSender: ICreateUserDTO = {
    name: "User Sender",
    email: "sender@mail.com",
    password: "test123",
  }

  const userDataReceiver: ICreateUserDTO = {
    name: "User Receiver",
    email: "receiver@mail.com",
    password: "test123",
  }

  let usersRepositoryInMemory: InMemoryUsersRepository;
  let statementsRepositoryInMemory: InMemoryStatementsRepository;
  let transfersRepositoryInMemory: InMemoryTransfersRepository;
  let createUserUseCase: CreateUserUseCase;
  let createTransferUseCase: CreateTransferUseCase;

  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    transfersRepositoryInMemory = new InMemoryTransfersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository(transfersRepositoryInMemory);
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    createTransferUseCase = new CreateTransferUseCase(
      statementsRepositoryInMemory,
      transfersRepositoryInMemory,
    );
  });

  it("Should be able to create a transfer", async () => {
    const userSender = await createUserUseCase.execute(userDataSender);
    const userReceiver = await createUserUseCase.execute(userDataReceiver);

    await statementsRepositoryInMemory.create({
      ...statementData,
      user_id: `${userSender.id}`,
      amount: 5000
    });

    const transfer = await createTransferUseCase.execute({
      id: `${userSender.id}`,
      sender_id: `${userReceiver.id}`,
      amount: 2400,
      description: "Transfer Test"
    });

    expect(transfer.id).toBe(userSender.id);
    expect(transfer.sender_id).toBe(userReceiver.id);
    expect(transfer.amount).toBe(2400);
    expect(transfer.description).toBe("Transfer Test");
  })

  it("Balance must correspond to the transfer made", async () => {
    const userSender = await createUserUseCase.execute(userDataSender);
    const userReceiver = await createUserUseCase.execute(userDataReceiver);

    await statementsRepositoryInMemory.create({
      ...statementData,
      user_id: `${userSender.id}`,
      amount: 5000,
    });

    await createTransferUseCase.execute({
      id: `${userSender.id}`,
      sender_id: `${userReceiver.id}`,
      amount: 3000,
      description: "Test Transfer"
    });

    const senderBalancer = await statementsRepositoryInMemory.getUserBalance({user_id: `${userSender.id}`});
    const receiverBalancer = await statementsRepositoryInMemory.getUserBalance({user_id: `${userReceiver.id}`,});

    expect(senderBalancer.balance).toBe(2000);
    expect(receiverBalancer.balance).toBe(3000);
  });

  it("Should not be able to create a transfer if the user does not have enough funds", async () => {
    const userSender = await createUserUseCase.execute(userDataSender);
    const userReceiver = await createUserUseCase.execute(userDataReceiver);

    await expect(async () => await createTransferUseCase.execute({
      id: `${userSender.id}`,
      sender_id: `${userReceiver.id}`,
      amount: 2700,
      description: "Transfer Test"
    })).rejects.toBeInstanceOf(AppError);
  });
})
