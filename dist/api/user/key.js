"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const connection_1 = __importDefault(require("../../database/connection"));
const homeKey = {
    createKey: async (req, res) => {
        try {
            const uuid = (0, uuid_1.v4)();
            const [keyCount] = await connection_1.default.query('SELECT COUNT(*) as count FROM members WHERE user_id = ?', [req.user?.userId]);
            if (keyCount[0].count > 0) {
                return res.status(400).json({ error: 'You have a key already' });
            }
            const home = await connection_1.default.query('INSERT INTO home_keys (label, value) VALUES (?, ?)', ["HOME", uuid]);
            const token = jsonwebtoken_1.default.sign({ uuid }, process.env.JWT_KEY_SECRET || "JWT_KEY_SECRET");
            // console.log(home);
            await connection_1.default.query('INSERT INTO members (is_admin, home_id, user_id) VALUES (?, ?, ?)', [true, home[0].insertId, req.user?.userId]);
            return res.json({ token });
        }
        catch (error) {
            console.error('Key generation error:', error);
            res.status(500).json({ error: 'Key generation failed' });
        }
    },
    getKey: async (req, res) => {
        try {
            const [mem] = await connection_1.default.query('SELECT * FROM members WHERE user_id = ?', [req.user?.userId]);
            if (mem.length < 1) {
                return homeKey.createKey(req, res);
            }
            if (mem[0].is_admin !== 1) {
                return res.status(403).json({ error: 'Only admin can get the key' });
            }
            const [key] = await connection_1.default.query('SELECT * FROM home_keys WHERE id = ?', [mem[0].home_id]);
            const token = jsonwebtoken_1.default.sign({ uuid: key[0].value }, process.env.JWT_KEY_SECRET || "JWT_KEY_SECRET");
            return res.json({ token });
        }
        catch (error) {
            console.error('Key generation error:', error);
            res.status(500).json({ error: 'Key generation failed' });
        }
    }
};
exports.default = homeKey;
