import type { Identifiable } from './shared.dto';

export interface UserDto extends Identifiable {
  name: string;
  avatar: string;
  email: string;
}
