import { getMultipleItems, runSql } from "./db/sqlite";

export interface WeightRecord {
  id: string;
  userId: string;
  weight: number;
  date: string; // ISO date string (YYYY-MM-DD)
  source: "profile" | "workout"; // 체중 기록 출처
  createdAt: number;
}

export const weightRecordService = {
  /**
   * 체중 기록 생성
   */
  async createWeightRecord(userId: string, weight: number, source: "profile" | "workout"): Promise<WeightRecord> {
    const id = `weight_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = Date.now();
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    await runSql(
      `INSERT INTO weight_records (id, user_id, weight, date, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, weight, date, source, now]
    );

    return {
      id,
      userId,
      weight,
      date,
      source,
      createdAt: now,
    };
  },

  /**
   * 특정 사용자의 모든 체중 기록 조회
   */
  async getWeightRecordsByUserId(userId: string): Promise<WeightRecord[]> {
    const rows = await getMultipleItems<{
      id: string;
      user_id: string;
      weight: number;
      date: string;
      source: string;
      created_at: number;
    }>(`SELECT * FROM weight_records WHERE user_id = ? ORDER BY date DESC`, [userId]);

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      weight: row.weight,
      date: row.date,
      source: row.source as "profile" | "workout",
      createdAt: row.created_at,
    }));
  },

  /**
   * 모든 체중 기록 조회 (통계용)
   */
  async getAllWeightRecords(): Promise<WeightRecord[]> {
    const rows = await getMultipleItems<{
      id: string;
      user_id: string;
      weight: number;
      date: string;
      source: string;
      created_at: number;
    }>(`SELECT * FROM weight_records ORDER BY date DESC`);

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      weight: row.weight,
      date: row.date,
      source: row.source as "profile" | "workout",
      createdAt: row.created_at,
    }));
  },

  /**
   * 특정 날짜의 체중 기록이 있는지 확인
   */
  async hasWeightRecordForDate(userId: string, date: string): Promise<boolean> {
    const rows = await getMultipleItems<{ count: number }>(
      `SELECT COUNT(*) as count FROM weight_records WHERE user_id = ? AND date = ? AND source = 'profile'`,
      [userId, date]
    );
    return rows[0].count > 0;
  },

  /**
   * 특정 날짜의 프로필 체중 기록 업데이트
   */
  async updateWeightRecordForDate(userId: string, date: string, weight: number): Promise<void> {
    await runSql(`UPDATE weight_records SET weight = ? WHERE user_id = ? AND date = ? AND source = 'profile'`, [weight, userId, date]);
  },
};
