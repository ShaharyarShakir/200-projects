export interface ITokenPayload {
  id: string;
  shopId: string;
  role: string;
  email: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    shopId: string;
  };
}
