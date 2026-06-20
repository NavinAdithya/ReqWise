"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const child_process_1 = require("child_process");
let connectPromise = null;
const connectDB = async () => {
    if (mongoose_1.default.connection.readyState === 1) {
        console.log('MongoDB connection is already active. Skipping connectDB.');
        return;
    }
    if (connectPromise) {
        console.log('MongoDB connection is already in progress. Reusing connection promise...');
        return connectPromise;
    }
    connectPromise = (async () => {
        let connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/reqwise';
        if (process.env.NODE_ENV === 'development' || connUri.includes('127.0.0.1') || process.env.NODE_ENV === 'test') {
            // Reuse global memory server if it exists (e.g. across sequential Jest tests)
            if (!global.__MONGO_URI__) {
                const mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
                global.__MONGO_SERVER__ = mongoServer;
                global.__MONGO_URI__ = mongoServer.getUri();
                console.log('Started global MongoDB Memory Server.');
            }
            connUri = global.__MONGO_URI__;
            process.env.MONGODB_URI = connUri;
        }
        // Disconnect any active connections to reset connection state in Mongoose
        await mongoose_1.default.disconnect();
        console.log(`Connecting to MongoDB at ${connUri}...`);
        await mongoose_1.default.connect(connUri);
        console.log(`MongoDB Connected successfully`);
        // Auto-seed only in development and only if we just created the server
        if (process.env.NODE_ENV === 'development' && !global.__SEEDED__) {
            global.__SEEDED__ = true;
            console.log('Running auto-seed for in-memory database...');
            (0, child_process_1.exec)('npx ts-node src/scripts/seedProduction.ts', { env: { ...process.env, MONGODB_URI: connUri } }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Auto-seed error: ${error.message}`);
                    return;
                }
                console.log(`Auto-seed finished successfully.`);
            });
        }
    })();
    try {
        await connectPromise;
    }
    catch (error) {
        connectPromise = null; // Reset on failure so we can retry
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
