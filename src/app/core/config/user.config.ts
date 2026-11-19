import { UserDto } from '../dto';

/** The signed-in user. The app has no authentication, so this is fixed (a user from the seed data). */
export const CURRENT_USER: UserDto = { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john.doe@company.com' };
