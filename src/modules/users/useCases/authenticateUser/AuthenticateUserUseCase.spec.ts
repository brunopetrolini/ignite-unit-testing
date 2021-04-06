import jwt from "jsonwebtoken"
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { ICreateUserDTO } from "../createUser/ICreateUserDTO"
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase"
import authConfig from '../../../../config/auth';
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { User } from "../../entities/User";
import { AppError } from "../../../../shared/errors/AppError";

describe("Authenticate User Use Case", () => {
  interface ITokenUser {
    user: User,
    token: string,
  }

  const userData: ICreateUserDTO = {
    name: "Test Admin",
    email: "admin@test.com",
    password: "test123"
  }

  let usersRepository: InMemoryUsersRepository;
  let authenticateUserUseCase: AuthenticateUserUseCase;
  let createUserUseCase: CreateUserUseCase;

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepository);
    createUserUseCase = new CreateUserUseCase(usersRepository);
  })

  it("Should be able to init a session", async() => {
    await createUserUseCase.execute(userData);

    const { user, token } = await authenticateUserUseCase.execute({
      email: userData.email,
      password: userData.password
    });

    const decodedToken = jwt.verify(token, authConfig.jwt.secret) as ITokenUser;

    expect(user).toHaveProperty("id");
    expect(user).not.toHaveProperty("password");
    expect(user.name).toEqual(userData.name);
    expect(user.email).toEqual(userData.email);

    expect(decodedToken.user).toHaveProperty("id");
    expect(decodedToken.user).toHaveProperty("password");
    expect(decodedToken.user.name).toEqual(userData.name);
    expect(decodedToken.user.email).toEqual(userData.email);
  });

  it("Should not be able to init a session if password is incorrect", async () => {
    await createUserUseCase.execute(userData);

    await authenticateUserUseCase.execute({
      email: userData.email,
      password: userData.password
    });

    expect( async () => await authenticateUserUseCase.execute({
      email: userData.email,
      password: userData.password + "-incorrect"
    })).rejects.toBeInstanceOf(AppError);
  });

  it("should not be able to init a session if user not exists", () => {
    expect( async () => await authenticateUserUseCase.execute({
      email: userData.email,
      password: userData.password
    })).rejects.toBeInstanceOf(AppError);
  });
});
