export const jwtConfig = {
    secret: process.env.JWT_SECRET || 'super-secret',
    expiresIn: '1d',
};
