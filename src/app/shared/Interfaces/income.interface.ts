import { User } from "./user.interface";

export interface Income{
id: string,
userId: number,
source: string,
amount: number,
period: string,
description: string
}