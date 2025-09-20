import { UserRole } from "../enum/user-role";

export interface User{
id: number,
username: string,
password: string,
name: string,
email: string,
role: UserRole,
documentType: string,
documentNumber: string,
address: string
}
