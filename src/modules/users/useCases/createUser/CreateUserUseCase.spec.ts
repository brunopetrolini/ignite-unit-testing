import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { CreateUserUseCase } from "./CreateUserUseCase"
import { ICreateUserDTO } from "./ICreateUserDTO"

describe("Create User Use Case", () => {
  const userData: ICreateUserDTO = {
    name: "Admin",
    email: "admin@finapi.com.br",
    password: "master"
  }

  let createUserUseCase: CreateUserUseCase;
  let usersRepository: InMemoryUsersRepository;

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);
  });

  it("Should be able to create a user", async() => {
    const user = await createUserUseCase.execute(userData);

    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("password");
    expect(user.name).toEqual(userData.name);
    expect(user.email).toEqual(userData.email);
    expect(user.password).not.toEqual(userData.password);
  });


  it("Should not be able to create a user if it exists", async () => {
    await createUserUseCase.execute(userData);

    expect( async () => {
      await createUserUseCase.execute(userData)
    }).rejects.toBeInstanceOf(AppError);
  });
});
