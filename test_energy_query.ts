import pool from './src/database/connection';
import { RowDataPacket } from 'mysql2';

async function testQuery() {
    try {
        const address = 1;
        console.log('Testing query for address:', address);

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                created_at, active_energy 
             FROM energy_data 
             WHERE address = ?`,
            [address]
        );
        console.log('All records:', rows);

        const [weeklyRows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                DATE(created_at) as date, 
                MAX(active_energy) - MIN(active_energy) as value 
             FROM energy_data 
             WHERE address = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [address]
        );
        console.log('Weekly aggregation:', weeklyRows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

testQuery();
