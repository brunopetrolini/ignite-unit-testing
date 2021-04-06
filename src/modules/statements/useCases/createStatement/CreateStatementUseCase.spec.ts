import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

describe("Create Statement", () => {
  enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw'
  }

  interface ICreateStatementDTO {
    user_id: string;
    amount: number;
    description: string;
    type: OperationType;
  }

  const statementData: ICreateStatementDTO = {
    user_id: "any_id",
    amount: 0,
    description: "any_description",
    type: OperationType.WITHDRAW
  }

  const userData: ICreateUserDTO = {
    name: "Admin",
    email: "admin@finapi.com.br",
    password: "master"
  }

  let usersRepository: InMemoryUsersRepository;
  let statementsRepository: InMemoryStatementsRepository;
  let createUserUserCase: CreateUserUseCase;
  let createStatementUseCase: CreateStatementUseCase;

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    statementsRepository = new InMemoryStatementsRepository();
    createUserUserCase = new CreateUserUseCase(usersRepository);
    createStatementUseCase = new CreateStatementUseCase(
      usersRepository,
      statementsRepository
    );
  })

  it("Should be able to create a statement", async () => {
    const user = await createUserUserCase.execute(userData);

    const statement = await createStatementUseCase.execute({
      ...statementData, user_id: `${user.id}`,
    });

    expect(statement).toHaveProperty("id");
    expect(statement.user_id).toEqual(user.id);
    expect(statement.type).toEqual(OperationType.WITHDRAW);
    expect(statement.amount).toEqual(statementData.amount);
    expect(statement.description).toEqual(statementData.description);
  });

  it("Should not be able to create a statement if user not exists", async () => {
    await expect(async () => {
      await createStatementUseCase.execute(statementData);
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it("Should not be able to create a statement with insufficient funds", async () => {
    const user = await createUserUserCase.execute(userData);

    await expect(async () => await createStatementUseCase.execute({
      ...statementData,
      user_id: `${user.id}`,
      amount: 500
    })).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });
});
