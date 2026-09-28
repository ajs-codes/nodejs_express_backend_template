export type SocketUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthenticatedSocketData = {
  user: SocketUser;
};
