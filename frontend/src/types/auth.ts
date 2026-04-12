export type LoginBody = {
  email: string;
  password: string;
};

export type RegisterBody = {
  email: string;
  password: string;
  organization_name: string;
};

export type AuthTokenResponse = {
  token: string;
};
