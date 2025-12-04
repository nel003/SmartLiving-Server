import { Request, Response } from 'express';
import pool from '../database/connection';
import { RowDataPacket } from 'mysql2';
import logger from '../utils/logger';

export const getUsageStats = async (req: Request, res: Response) => {
    try {
        const address = 1;

        // 1. Weekly Data (Last 7 days)
        const [weeklyRows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                DATE(created_at) as date, 
                MAX(active_energy) - MIN(active_energy) as value,
                MAX(active_energy) as max_val,
                COUNT(*) as count
             FROM energy_data 
             WHERE address = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [address]
        );

        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const weeklyMap = new Map();

        weeklyRows.forEach(row => {
            // Handle date string correctly (MySQL date might be string or Date object)
            const dateObj = new Date(row.date);
            const dateStr = dateObj.toISOString().split('T')[0];

            let val = parseFloat(row.value);

            // If usage is 0 but we have a single reading > 0, assume it's the total usage since 0
            if (val === 0 && row.count === 1 && row.max_val > 0) {
                val = parseFloat(row.max_val);
            }

            weeklyMap.set(dateStr, val);
        });

        const finalWeeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const value = weeklyMap.get(dateStr) || 0;
            finalWeeklyData.push({
                value: parseFloat(value.toFixed(2)),
                label: days[d.getDay()],
                color: '#10B981'
            });
        }

        // 2. Monthly Trend (Last 6 months)
        const [monthlyRows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month, 
                MAX(active_energy) - MIN(active_energy) as value,
                MAX(active_energy) as max_val,
                COUNT(*) as count
             FROM energy_data 
             WHERE address = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
             ORDER BY month ASC`,
            [address]
        );

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = monthlyRows.map(row => {
            const [year, month] = row.month.split('-');
            let val = parseFloat(row.value);
            if (val === 0 && row.count === 1 && row.max_val > 0) {
                val = parseFloat(row.max_val);
            }
            return {
                value: parseFloat(val.toFixed(2)),
                label: monthNames[parseInt(month) - 1]
            };
        });

        // 3. Summary Stats
        const totalWeek = finalWeeklyData.reduce((acc, curr) => acc + curr.value, 0);
        const dailyAverage = totalWeek / 7;

        // Total Month
        const [currentMonthRow] = await pool.query<RowDataPacket[]>(
            `SELECT 
                MAX(active_energy) - MIN(active_energy) as value,
                MAX(active_energy) as max_val,
                COUNT(*) as count
             FROM energy_data 
             WHERE address = ? AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())`,
            [address]
        );

        let totalMonth = currentMonthRow[0]?.value || 0;
        if (totalMonth === 0 && currentMonthRow[0]?.count === 1 && currentMonthRow[0]?.max_val > 0) {
            totalMonth = currentMonthRow[0].max_val;
        }

        res.json({
            success: true,
            data: {
                weekly: finalWeeklyData,
                monthly: monthlyData,
                stats: {
                    totalWeek: parseFloat(totalWeek.toFixed(2)),
                    dailyAverage: parseFloat(dailyAverage.toFixed(2)),
                    totalMonth: parseFloat(totalMonth.toFixed(2))
                }
            }
        });

    } catch (error) {
        logger.error('Error fetching energy usage stats', { error });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch energy usage stats'
        });
    }
};
