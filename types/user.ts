export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRegister {
  email: string;
  password: string;
  full_name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

