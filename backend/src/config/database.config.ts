export const databaseConfig = {
    get uri() {
        return process.env.MONGO_URI;
    },
};
