import { getRepository, Repository } from "typeorm";

import { Statement } from "../entities/Statement";
import { ICreateStatementDTO } from "../dtos/ICreateStatementDTO";
import { IGetBalanceDTO } from "../dtos/IGetBalanceDTO";
import { IGetStatementOperationDTO } from "../dtos/IGetStatementOperationDTO";
import { IStatementsRepository } from "./IStatementsRepository";

export class StatementsRepository implements IStatementsRepository {
  private repository: Repository<Statement>;

  constructor() {
    this.repository = getRepository(Statement);
  }

  async create({
    user_id,
    amount,
    description,
    type,
    transfer_id,
  }: ICreateStatementDTO): Promise<Statement> {
    const statement = this.repository.create({
      user_id,
      amount,
      description,
      type,
      transfer_id,
    });

    return this.repository.save(statement);
  }

  async findStatementOperation({ statement_id, user_id }: IGetStatementOperationDTO): Promise<Statement | undefined> {
    return this.repository.findOne(statement_id, {
      where: { user_id }
    });
  }

  async getUserBalance({ user_id, with_statement = false }: IGetBalanceDTO):
    Promise<
      { balance: number, statement: Statement[] }
    >
  {
    const statement = await this.repository.find({
      where: { user_id },
      relations: ['transfer']
    });

    const balance = statement.reduce((acc, operation) => {
      if (operation.type === 'deposit') {
        return acc + Number(operation.amount);
      } else {
        return acc - Number(operation.amount);
      }
    }, 0);

    return {
      statement,
      balance
    }
  }
}
