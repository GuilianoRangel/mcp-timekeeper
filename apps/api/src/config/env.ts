export const env = {
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  editWindowDays: Number(process.env.EDIT_WINDOW_DAYS ?? '30'),
  timezone: process.env.APP_TIMEZONE ?? 'America/Sao_Paulo'
};
