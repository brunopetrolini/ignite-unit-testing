import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository"
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase"
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO"
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository"
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase"
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO"
import { GetStatementOperationError } from "./GetStatementOperationError"
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase"

describe("Get Statement Operation Use Case", () => {
  enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
  }

  const statementData: ICreateStatementDTO = {
    user_id: "",
    amount: 0,
    description: "Statement Test",
    type: OperationType.DEPOSIT
  }

  const userData: ICreateUserDTO = {
    name: "Test User",
    email: "user@test.com",
    password: "test123"
  }

  let statementsRepository: InMemoryStatementsRepository;
  let usersRepository: InMemoryUsersRepository;
  let createUserUseCase: CreateUserUseCase;
  let createStatementUseCase: CreateStatementUseCase;
  let getStatementOperationUseCase: GetStatementOperationUseCase;

  beforeEach(() => {
    statementsRepository = new InMemoryStatementsRepository();
    usersRepository = new InMemoryUsersRepository();
    createStatementUseCase = new CreateStatementUseCase(
      usersRepository,
      statementsRepository
    );
    createUserUseCase = new CreateUserUseCase(usersRepository)
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      usersRepository,
      statementsRepository
    );
  });

  it("Should be able to get one statement", async () => {
    const user = await createUserUseCase.execute(userData)
    const statement = await createStatementUseCase.execute({
      ...statementData,
      user_id: `${user.id}`
    });

    const response = await getStatementOperationUseCase.execute({
      user_id: `${user.id}`,
      statement_id: `${statement.id}`
    });

    expect(response).toHaveProperty("id");
    expect(response).toHaveProperty("user_id");
    expect(response.type).toBe(statementData.type);
    expect(response.amount).toBe(statementData.amount);
    expect(response.description).toBe(statementData.description);
  });

  it("Should not be able to get one statement if it user not exists", async () => {
    const user = await createUserUseCase.execute(userData);

    const statement = await createStatementUseCase.execute({
      ...statementData,
      user_id: `${user.id}`
    });

    expect( async () => await getStatementOperationUseCase.execute({
      user_id: `${user.id}-invalid`,
      statement_id: `${statement.id}`
    })).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
  });

  it("Should not be able to get one statement if it statement non-exists", async () => {
    const user = await createUserUseCase.execute(userData);

    const statement = await createStatementUseCase.execute({
      ...statementData,
      user_id: `${user.id}`
    });

    expect( async () => await getStatementOperationUseCase.execute({
      user_id: `${user.id}`,
      statement_id: `${statement.id}-invalid`
    })).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
  });
})
