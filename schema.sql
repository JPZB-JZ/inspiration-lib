-- 灵感库数据库初始化（双表结构：灵感 + 复刻记录）
CREATE DATABASE IF NOT EXISTS inspiration_engine
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE inspiration_engine;

DROP TABLE IF EXISTS replications;
DROP TABLE IF EXISTS materials;

CREATE TABLE materials (
  id          VARCHAR(36) PRIMARY KEY,
  link        TEXT COMMENT '视频链接',
  name        VARCHAR(255) NOT NULL COMMENT '灵感名称',
  brand       VARCHAR(255) DEFAULT '' COMMENT '品牌',
  category    VARCHAR(255) DEFAULT '' COMMENT '产品类别',
  visual      VARCHAR(500) DEFAULT '' COMMENT '视觉锤',
  hook        VARCHAR(500) DEFAULT '' COMMENT '文案钩子',
  psychology  VARCHAR(500) DEFAULT '' COMMENT '心理标签',
  status      VARCHAR(20) DEFAULT '待复刻' COMMENT '待复刻/已验证/淘汰',
  date        DATE DEFAULT NULL COMMENT '采集日期',
  note        TEXT COMMENT '投手备注',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='灵感表';

CREATE TABLE replications (
  id            VARCHAR(36) PRIMARY KEY,
  material_id   VARCHAR(36) NOT NULL COMMENT '关联灵感 ID',
  link          TEXT COMMENT '复刻视频链接',
  spend         DECIMAL(12,2) DEFAULT 0.00 COMMENT '消耗金额',
  impressions   INT DEFAULT 0 COMMENT '展示量',
  effect        VARCHAR(20) DEFAULT '一般' COMMENT '跑量/一般/无效果',
  notes         TEXT COMMENT '投手笔记',
  leads         INT DEFAULT 0 COMMENT '获线索数',
  date          DATE DEFAULT NULL COMMENT '复刻日期',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='复刻记录表';

CREATE INDEX idx_material_id ON replications(material_id);

-- v2.1 migration: 获线索数
ALTER TABLE replications ADD COLUMN leads INT DEFAULT 0 COMMENT '获线索数';


-- v2.2 migration: AI分析报告
CREATE TABLE IF NOT EXISTS ai_reports (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) DEFAULT '' COMMENT '报告标题',
  content TEXT COMMENT 'AI分析结果全文',
  suggestions TEXT COMMENT '拍摄建议部分（结构化）',
  data_snapshot TEXT COMMENT '生成时的数据快照JSON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI分析报告';
