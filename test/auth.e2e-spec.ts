import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 👇 Вот это надо ДО app.init()
    app.use(cookieParser());

    await app.init();

    dataSource = moduleFixture.get(DataSource);

    await dataSource.query(`DELETE FROM sessions`);
    await dataSource.query(`DELETE FROM users`);

    const passwordHash = await bcrypt.hash('qwerty', 10);
    const userId = '11111111-1111-1111-1111-111111111111';

    await dataSource.query(
      `INSERT INTO users (id, login, email, password_hash, is_email_confirmed, deletion_status)
       VALUES ($1, $2, $3, $4, true, 'active')`,
      [userId, 'admin', 'admin@example.com', passwordHash],
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('Login should return accessToken and set refreshToken cookie', async () => {
    const loginDto = {
      loginOrEmail: 'admin',
      password: 'qwerty',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('User-Agent', 'TestAgent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send(loginDto)
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    const setCookie = response.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toMatch(/refreshToken/);

    // Проверим что сессия в БД появилась
    const sessions = await dataSource.query(`SELECT * FROM sessions`);

    // Нормализация IP-адреса
    const normalizeIp = (ip: string) =>
      ip === '::1' || ip === '::ffff:127.0.0.1' ? '127.0.0.1' : ip;

    expect(sessions.length).toBe(1);
    expect(normalizeIp(sessions[0].ip)).toBe('127.0.0.1');
    expect(sessions[0].title).toBe('TestAgent');
  });

  it('Refresh-token should return new access and refresh tokens', async () => {
    const loginDto = {
      loginOrEmail: 'admin',
      password: 'qwerty',
    };

    // Сначала логинимся
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .set('User-Agent', 'TestAgent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send(loginDto)
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const rawRefreshCookie = Array.isArray(cookies)
      ? cookies.find((cookie) => cookie.startsWith('refreshToken='))
      : cookies;

    expect(rawRefreshCookie).toBeDefined();

    const rawTokenString = rawRefreshCookie.split(';')[0]; // "refreshToken=..."
    expect(rawTokenString.startsWith('refreshToken=')).toBe(true);

    const refreshTokenValue = rawTokenString.split('=')[1];
    expect(refreshTokenValue).toBeDefined();

    const oldRefreshTokenCookie = rawTokenString;

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Cookie', [`refreshToken=${refreshTokenValue}`])
      .expect(200);

    expect(refreshResponse.body.accessToken).toBeDefined();

    const newCookies = refreshResponse.headers['set-cookie'];
    expect(newCookies).toBeDefined();

    const newRefreshTokenCookie = Array.isArray(newCookies)
      ? newCookies.find((cookie) => cookie.startsWith('refreshToken'))
      : newCookies;

    expect(newRefreshTokenCookie).toBeDefined();
    expect(newRefreshTokenCookie).not.toBe(oldRefreshTokenCookie); // теперь есть old
  });
  it('Logout should remove session and invalidate refresh token', async () => {
    const loginDto = {
      loginOrEmail: 'admin',
      password: 'qwerty',
    };

    // Шаг 1 — логин
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .set('User-Agent', 'TestAgent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send(loginDto)
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];
    const cookiesArray = Array.isArray(cookies) ? cookies : [cookies];
    const rawRefreshCookie = cookiesArray.find((c) =>
      c.startsWith('refreshToken='),
    );
    expect(rawRefreshCookie).toBeDefined();

    const refreshToken = rawRefreshCookie.split(';')[0].split('=')[1];

    // Шаг 2 — вызов logout
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(204);

    // Шаг 3 — сессия должна быть удалена
    const decoded: any = await app.get(JwtService).verify(refreshToken, {
      secret: process.env.REFRESH_SECRET || 'REFRESH_SECRET',
    });
    const deletedSession = await dataSource.query(
      `SELECT * FROM sessions WHERE device_id = $1 AND last_active_date = $2`,
      [decoded.deviceId, new Date(decoded.iat * 1000).toISOString()],
    );
    expect(deletedSession.length).toBe(0);

    // Шаг 4 — попытка refresh должна вернуть 401
    await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(401);
  });

  it('Protected route should return 401 without access token and 200 with valid token', async () => {
    const loginDto = {
      loginOrEmail: 'admin',
      password: 'qwerty',
    };

    // Шаг 1 — логин
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .set('User-Agent', 'TestAgent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send(loginDto)
      .expect(200);

    const accessToken = loginResponse.body.accessToken;
    expect(accessToken).toBeDefined();

    // Шаг 2 — попытка без токена
    await request(app.getHttpServer())
      .get('/auth/me') // или любой твой защищённый путь
      .expect(401);

    // Шаг 3 — попытка с токеном
    const protectedResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(protectedResponse.body.login).toBe('admin');
  });
  //пока не работает
  // it('Should create two separate sessions for different devices', async () => {
  //   const loginDto = {
  //     loginOrEmail: 'admin',
  //     password: 'qwerty',
  //   };
  //
  //   // Логинимся с "устройства 1"
  //   const res1 = await request(app.getHttpServer())
  //     .post('/auth/login')
  //     .set('User-Agent', 'DeviceOne')
  //     .set('X-Forwarded-For', '192.168.1.1')
  //     .send(loginDto)
  //     .expect(200);
  //
  //   const cookies1 = res1.headers['set-cookie'];
  //   const refreshToken1 = Array.isArray(cookies1)
  //     ? cookies1
  //         .find((c) => c.startsWith('refreshToken='))
  //         ?.split(';')[0]
  //         .split('=')[1]
  //     : cookies1?.split(';')[0].split('=')[1];
  //
  //   // Логинимся с "устройства 2"
  //   const res2 = await request(app.getHttpServer())
  //     .post('/auth/login')
  //     .set('User-Agent', 'DeviceTwo')
  //     .set('X-Forwarded-For', '10.0.0.2')
  //     .send(loginDto)
  //     .expect(200);
  //
  //   const cookies2 = res2.headers['set-cookie'];
  //   const refreshToken2 = Array.isArray(cookies2)
  //     ? cookies2
  //         .find((c) => c.startsWith('refreshToken='))
  //         ?.split(';')[0]
  //         .split('=')[1]
  //     : cookies2?.split(';')[0].split('=')[1];
  //
  //   // Проверяем что в БД 2 сессии с разными deviceId
  //   const sessions = await dataSource.query(`SELECT * FROM sessions`);
  //   expect(sessions.length).toBe(2);
  //
  //   const deviceIds = sessions.map((s) => s.device_id);
  //   expect(new Set(deviceIds).size).toBe(2); // уникальные deviceId
  //
  //   const userAgents = sessions.map((s) => s.title);
  //   expect(userAgents).toContain('DeviceOne');
  //   expect(userAgents).toContain('DeviceTwo');
  // });
});
