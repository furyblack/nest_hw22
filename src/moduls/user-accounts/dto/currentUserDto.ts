export class MeViewDto {
  login: string;
  email: string;
  userId: string;

  static mapToView(row: any): MeViewDto {
    return {
      login: row.login,
      email: row.email,
      userId: row.id.toString(),
    };
  }
}
