import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { CreateUserUseCase } from "../createUser/CreateUserUseCase"
import { ICreateUserDTO } from "../createUser/ICreateUserDTO"
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase"

describe("Show User Profile Use Case", () => {
  const userData: ICreateUserDTO = {
    name: "Admin",
    email: "admin@finapi.com",
    password: "master"
  }

  let usersRepository: InMemoryUsersRepository;
  let createUserUseCase: CreateUserUseCase;
  let showUserProfileUseCase: ShowUserProfileUseCase;

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);
    showUserProfileUseCase = new ShowUserProfileUseCase(usersRepository);
  });

  it("Should be able to get user information by id", async () => {
    const user = await createUserUseCase.execute(userData);

    const response = await showUserProfileUseCase.execute(user.id ?? "");

    expect(response).toHaveProperty("id");
    expect(response).toHaveProperty("password");
    expect(response.name).toEqual(userData.name);
    expect(response.email).toEqual(userData.email);
    expect(response.password).not.toEqual(userData.password);
  });

  it("Should not be able to get user information if it id is invalid", async () => {
    await expect( async () => await showUserProfileUseCase.execute(""))
      .rejects.toBeInstanceOf(AppError);
  });
});
