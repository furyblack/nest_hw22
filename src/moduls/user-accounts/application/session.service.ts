import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SessionService {
  constructor(private dataSource: DataSource) {}

  async findSessionByDeviceIdAndDate(deviceId: string, iat: number) {
    const date = new Date(iat * 1000);
    const lower = new Date(date.getTime() - 500).toISOString();
    const upper = new Date(date.getTime() + 500).toISOString();

    const rows = await this.dataSource.query(
      `SELECT * FROM sessions WHERE device_id = $1
                                AND last_active_date BETWEEN $2 AND $3`,
      [deviceId, lower, upper],
    );
    return rows[0] || null;
  }

  async updateSessionLastActiveDate(
    deviceId: string,
    oldIat: number,
    newIat: number,
  ) {
    const oldDate = new Date(oldIat * 1000).toISOString();
    const newDate = new Date(newIat * 1000).toISOString();

    const result = await this.dataSource.query(
      `UPDATE sessions SET last_active_date = $1
       WHERE device_id = $2 AND last_active_date = $3`,
      [newDate, deviceId, oldDate],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException('Session not found for update');
    }
  }

  async deleteSessionByDeviceIdAndDate(deviceId: string, iat: number) {
    const targetDate = new Date(iat * 1000).toISOString();
    const result = await this.dataSource.query(
      `DELETE FROM sessions 
       WHERE device_id = $1 AND last_active_date = $2`,
      [deviceId, targetDate],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException('Session not found for deletion');
    }
  }

  async findAllSessionsForUser(userId: string) {
    return await this.dataSource.query(
      `SELECT device_id AS "deviceId", ip, title, last_active_date AS "lastActiveDate"
       FROM sessions WHERE user_id = $1`,
      [userId],
    );
  }

  async deleteAllOtherSessions(userId: string, currentDeviceId: string) {
    await this.dataSource.query(
      `DELETE FROM sessions 
       WHERE user_id = $1 AND device_id != $2`,
      [userId, currentDeviceId],
    );
  }

  async terminateSpecificSession(userId: string, deviceId: string) {
    // 1. Проверка принадлежности
    const rows = await this.dataSource.query(
      `SELECT user_id FROM sessions WHERE device_id = $1`,
      [deviceId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Session not found');
    }
    if (rows[0].user_id !== userId) {
      throw new ForbiddenException('Cannot terminate session of another user');
    }
    // 2. Удаление
    await this.dataSource.query(`DELETE FROM sessions WHERE device_id = $1`, [
      deviceId,
    ]);
  }

  async createSession({
    userId,
    deviceId,
    ip,
    title,
    lastActiveDate,
  }: {
    userId: string;
    deviceId: string;
    ip: string;
    title: string;
    lastActiveDate: Date;
  }) {
    await this.dataSource.query(
      `INSERT INTO sessions (user_id, device_id, ip, title, last_active_date)
     VALUES ($1, $2, $3, $4, $5)`,
      [userId, deviceId, ip, title, lastActiveDate.toISOString()],
    );
  }
}
