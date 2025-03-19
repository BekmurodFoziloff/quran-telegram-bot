export class CreateUserDto {
    id: number
    telegramId: number;
    firstName: string;
    username: string;
    createdAt: Date;
}

export default CreateUserDto;