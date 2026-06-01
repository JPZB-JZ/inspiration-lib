// 自动初始化数据库
const mysql = require('mysql2/promise');

async function init() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log('✅ 已连接到 MySQL');

  await conn.query('CREATE DATABASE IF NOT EXISTS inspiration_engine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await conn.query('USE inspiration_engine');

  await conn.query('DROP TABLE IF EXISTS replications');
  await conn.query('DROP TABLE IF EXISTS materials');

  await conn.query(`CREATE TABLE materials (
    id          VARCHAR(36) PRIMARY KEY,
    link        TEXT,
    name        VARCHAR(255) NOT NULL,
    brand       VARCHAR(255) DEFAULT '',
    category    VARCHAR(255) DEFAULT '',
    visual      VARCHAR(500) DEFAULT '',
    hook        VARCHAR(500) DEFAULT '',
    psychology  VARCHAR(500) DEFAULT '',
    status      VARCHAR(20) DEFAULT '待复刻',
    date        DATE DEFAULT NULL,
    note        TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await conn.query(`CREATE TABLE replications (
    id            VARCHAR(36) PRIMARY KEY,
    material_id   VARCHAR(36) NOT NULL,
    link          TEXT,
    spend         DECIMAL(12,2) DEFAULT 0.00,
    impressions   INT DEFAULT 0,
    effect        VARCHAR(20) DEFAULT '一般',
    notes         TEXT,
    date          DATE DEFAULT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await conn.query('CREATE INDEX idx_material_id ON replications(material_id)');

  console.log('✅ 数据表已创建');
  await conn.end();
  console.log('\n✨ 数据库初始化完成！');
  console.log('现在可以启动服务: npm start');
}

init().catch(err => {
  console.error('❌ 初始化失败:', err.message);
  console.log('\n请检查:');
  console.log('  1. MySQL 服务是否正在运行');
  console.log('  2. 设置密码: set DB_PASSWORD=你的密码');
  process.exit(1);
});
