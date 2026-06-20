"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
dotenv_1.default.config();
async function runDBTests() {
    console.log('--- Starting DB Connectivity Verification ---');
    try {
        await (0, db_1.connectDB)();
        const db = mongoose_1.default.connection.db;
        if (!db) {
            throw new Error('Database object not defined on connection');
        }
        console.log('Listing DB collections:');
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log('Found collections:', collectionNames);
        const expectedCollections = [
            'users',
            'requirements',
            'requirementchecklists',
            'validationresults',
            'reports',
            'reviewdecisions',
            'notifications',
            'auditlogs',
            'mistakes',
            'assessments'
        ];
        console.log('\nVerifying collection existence:');
        for (const name of expectedCollections) {
            const exists = collectionNames.includes(name);
            console.log(`- ${name}: ${exists ? 'EXISTS (OK)' : 'MISSING'}`);
        }
        console.log('\n--- Running CRUD Operations Verification on Test Collection ---');
        const testCollection = db.collection('test_verification');
        // 1. Insert
        console.log('1. Inserting document...');
        const insertResult = await testCollection.insertOne({ name: 'REQWISE_TEST', timestamp: new Date() });
        console.log('Inserted Document ID:', insertResult.insertedId);
        // 2. Query
        console.log('2. Querying document...');
        const doc = await testCollection.findOne({ _id: insertResult.insertedId });
        console.log('Queried Document:', doc);
        if (!doc || doc.name !== 'REQWISE_TEST') {
            throw new Error('Query verification failed or document mismatch');
        }
        // 3. Update
        console.log('3. Updating document...');
        const updateResult = await testCollection.updateOne({ _id: insertResult.insertedId }, { $set: { status: 'VERIFIED' } });
        console.log('Updated count:', updateResult.modifiedCount);
        const updatedDoc = await testCollection.findOne({ _id: insertResult.insertedId });
        console.log('Updated Document:', updatedDoc);
        if (!updatedDoc || updatedDoc.status !== 'VERIFIED') {
            throw new Error('Update verification failed');
        }
        // 4. Delete
        console.log('4. Deleting document...');
        const deleteResult = await testCollection.deleteOne({ _id: insertResult.insertedId });
        console.log('Deleted count:', deleteResult.deletedCount);
        if (deleteResult.deletedCount !== 1) {
            throw new Error('Delete verification failed');
        }
        const finalQuery = await testCollection.findOne({ _id: insertResult.insertedId });
        console.log('Final query after delete:', finalQuery);
        if (finalQuery !== null) {
            throw new Error('Document still exists after deletion');
        }
        console.log('\nCRUD operations: ALL PASSED');
    }
    catch (error) {
        console.error('Database Connectivity Phase Verification FAILED:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('Database connection closed.');
    }
}
runDBTests();
