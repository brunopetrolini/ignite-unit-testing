import { ICreateTransferDTO } from "../dtos/ICreateTransferDTO";
import { Transfer } from "../entities/Transfer";

export interface ITransfersRepository {
  create: (data: ICreateTransferDTO) => Promise<Transfer>;
  getTransfers:() => Promise<Transfer[]>;
}
