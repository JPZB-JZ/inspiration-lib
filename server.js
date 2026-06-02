const express = require('express');
require('dotenv').config({path:'/etc/inspiration-lib/.env'});
const path = require('path');
const session = require('express-session');
const https = require('https');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const APP_PASSWORD = process.env.APP_PASSWORD || '';

if (!APP_PASSWORD) {
  console.warn('⚠️  未设置 APP_PASSWORD 环境变量，使用默认密码 admin123');
}

app.use(express.json({ limit: '2mb' }));

// ================================================================
// Session 配置
// ================================================================

app.use(session({
  secret: process.env.SESSION_SECRET || 'inspiration-lib-secret-' + Date.now(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 小时
    sameSite: 'lax',
  },
}));

// ================================================================
// 认证中间件
// ================================================================

function requireAuth(req, res, next) {
  // 登录相关接口不需要验证
  if (req.path.startsWith('/api/auth/')) return next();
  if (req.session && req.session.authed) return next();
  // API 请求返回 401
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: '未登录' });
  // 页面请求返回登录页
  res.send(loginPage());
}

app.use(requireAuth);

// ================================================================
// 静态文件（需验证后才能访问）
// ================================================================

app.use(express.static(path.join(__dirname, 'public')));

// ================================================================
// 认证 API
// ================================================================

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const expected = APP_PASSWORD || 'admin123';
  if (password === expected) {
    req.session.authed = true;
    req.session.save();
    return res.json({ ok: true });
  }
  res.status(403).json({ error: '密码错误' });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/auth/check', (req, res) => {
  res.json({ authed: !!req.session?.authed });
});

// ================================================================
// 工具函数
// ================================================================

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

async function getAllMaterials(search, brand, status) {
  let sql = 'SELECT * FROM materials WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (name LIKE ? OR visual LIKE ? OR hook LIKE ? OR psychology LIKE ?)';
    const p = '%' + search + '%';
    params.push(p, p, p, p);
  }
  if (brand) { sql += ' AND brand LIKE ?'; params.push('%' + brand + '%'); }
  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }

  sql += ' ORDER BY created_at DESC';

  const [materials] = await pool.query(sql, params);
  const ids = materials.map(m => m.id);
  if (!ids.length) return [];

  const [repls] = await pool.query('SELECT * FROM replications WHERE material_id IN (?) ORDER BY created_at ASC', [ids]);

  const replMap = {};
  repls.forEach(r => {
    if (!replMap[r.material_id]) replMap[r.material_id] = [];
    replMap[r.material_id].push({
      id: r.id, link: r.link || '', spend: parseFloat(r.spend) || 0,
      impressions: r.impressions || 0, effect: r.effect || '一般',
      notes: r.notes || '', leads: r.leads || 0, date: r.date ? r.date.toISOString().split('T')[0] : '',
    });
  });

  return materials.map(m => ({
    id: m.id, link: m.link || '', name: m.name, brand: m.brand || '',
    category: m.category || '', visual: m.visual || '', hook: m.hook || '',
    psychology: m.psychology || '', status: m.status || '待复刻',
    date: m.date ? m.date.toISOString().split('T')[0] : '', note: m.note || '',
    createdAt: m.created_at ? m.created_at.toISOString() : '',
    replications: replMap[m.id] || [],
  }));
}

// ================================================================
// 灵感 CRUD
// ================================================================

app.get('/api/materials', async (req, res) => {
  try {
    const { search, status, brand } = req.query;
    res.json(await getAllMaterials(search, brand, status));
  } catch (err) {
    res.status(500).json({ error: '查询失败: ' + err.message });
  }
});

app.post('/api/materials', async (req, res) => {
  try {
    const { link, name, brand, category, visual, hook, psychology, status, date, note } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: '名称不能为空' });

    const id = 'm_' + uid();
    await pool.query(
      'INSERT INTO materials (id, link, name, brand, category, visual, hook, psychology, status, date, note) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [id, link || '', name.trim(), brand || '', category || '', visual || '', hook || '',
       psychology || '', status || '待复刻', date || null, note || '']
    );
    res.status(201).json(await getAllMaterials('', '', 'all'));
  } catch (err) {
    res.status(500).json({ error: '保存失败: ' + err.message });
  }
});

app.put('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { link, name, brand, category, visual, hook, psychology, status, date, note } = req.body;
    const [result] = await pool.query(
      'UPDATE materials SET link=?, name=?, brand=?, category=?, visual=?, hook=?, psychology=?, status=?, date=?, note=? WHERE id=?',
      [link || '', name || '', brand || '', category || '', visual || '', hook || '',
       psychology || '', status || '待复刻', date || null, note || '', id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: '灵感不存在' });
    res.json(await getAllMaterials('', '', 'all'));
  } catch (err) {
    res.status(500).json({ error: '更新失败: ' + err.message });
  }
});

app.delete('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM replications WHERE material_id = ?', [id]);
    await pool.query('DELETE FROM materials WHERE id = ?', [id]);
    res.json(await getAllMaterials('', '', 'all'));
  } catch (err) {
    res.status(500).json({ error: '删除失败: ' + err.message });
  }
});

// ================================================================
// 复刻记录 CRUD
// ================================================================

app.post('/api/replications', async (req, res) => {
  try {
    const { materialId, link, spend, impressions, leads, effect, notes, date } = req.body;
    if (!materialId) return res.status(400).json({ error: '缺少 materialId' });
    const id = 'r_' + uid();
    await pool.query(
      'INSERT INTO replications (id, material_id, link, spend, impressions, leads, effect, notes, date) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, materialId, link || '', parseFloat(spend) || 0, parseInt(impressions) || 0,
       parseInt(leads) || 0, effect || '一般', notes || '', date || null]
    );
    await pool.query("UPDATE materials SET status='已验证' WHERE id=? AND status='待复刻'", [materialId]);
    res.status(201).json(await getAllMaterials('', '', 'all'));
  } catch (err) {
    res.status(500).json({ error: '保存复刻失败: ' + err.message });
  }
});

app.put('/api/replications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { link, spend, impressions, leads, effect, notes, date } = req.body;
    await pool.query(
      'UPDATE replications SET link=?, spend=?, impressions=?, leads=?, effect=?, notes=?, date=? WHERE id=?',
      [link || '', parseFloat(spend) || 0, parseInt(impressions) || 0,
       parseInt(leads) || 0, effect || '一般', notes || '', date || null, id]
    );
    res.json(await getAllMaterials('', '', 'all'));
  } catch (err) {
    res.status(500).json({ error: '更新复刻失败: ' + err.message });
  }
});

app.delete('/api/replications/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM replications WHERE id = ?', [req.params.id]);
    res.json(await getAllMaterials('', '', 'all'));
  } catch (err) {
    res.status(500).json({ error: '删除复刻失败: ' + err.message });
  }
});

// ================================================================
// 复刻看板 API
// ================================================================

app.get('/api/replications/dashboard', async (req, res) => {
  try {
    const { search, effect, dateFrom, dateTo } = req.query;
    const [repls] = await pool.query(
      `SELECT r.id, r.material_id, r.link, r.spend, r.impressions, r.leads, r.effect, r.notes, r.date, r.created_at,
              m.name AS insp_name, m.brand AS insp_brand, m.category AS insp_category,
              m.visual AS insp_visual, m.hook AS insp_hook, m.psychology AS insp_psychology
       FROM replications r
       JOIN materials m ON r.material_id = m.id
       ORDER BY r.created_at DESC`
    );

    let data = repls.map(r => ({
      id: r.id, materialId: r.material_id, link: r.link || '',
      spend: parseFloat(r.spend) || 0, impressions: r.impressions || 0,
      leads: r.leads || 0,
      effect: r.effect || '一般', notes: r.notes || '',
      date: r.date ? r.date.toISOString().split('T')[0] : '',
      createdAt: r.created_at ? r.created_at.toISOString() : '',
      inspName: r.insp_name, inspBrand: r.insp_brand || '',
      inspCategory: r.insp_category || '', inspVisual: r.insp_visual || '',
      inspHook: r.insp_hook || '', inspPsychology: r.insp_psychology || '',
    }));

    // 筛选
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(d =>
        (d.inspName||'').toLowerCase().includes(s) ||
        (d.inspVisual||'').toLowerCase().includes(s) ||
        (d.inspHook||'').toLowerCase().includes(s) ||
        (d.inspPsychology||'').toLowerCase().includes(s) ||
        (d.inspBrand||'').toLowerCase().includes(s)
      );
    }
    if (effect && effect !== 'all') data = data.filter(d => d.effect === effect);
    if (dateFrom) data = data.filter(d => d.date >= dateFrom);
    if (dateTo) data = data.filter(d => d.date <= dateTo);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '查询失败: ' + err.message });
  }
});


// ================================================================
// 批量操作 API
// ================================================================

app.post('/api/materials/batch-status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !ids.length || !status) return res.status(400).json({ error: '参数不完整' });
    await pool.query('UPDATE materials SET status=? WHERE id IN (' + ids.map(() => '?').join(',') + ')', [status, ...ids]);
    res.json(await getAllMaterials('', '', 'all'));
  } catch (err) {
    res.status(500).json({ error: '批量更新失败: ' + err.message });
  }
});

// ================================================================
// 拍摄建议 API
// ================================================================

app.get('/api/suggestions', async (req, res) => {
  try {
    // 获取最新AI报告中的拍摄建议
    const [aiReports] = await pool.query(
      "SELECT id, title, suggestions, created_at FROM ai_reports WHERE suggestions != '' ORDER BY created_at DESC LIMIT 1"
    );
    let aiSuggestion = null;
    if (aiReports.length > 0 && aiReports[0].suggestions) {
      const r = aiReports[0];
      aiSuggestion = {
        id: r.id, title: r.title,
        content: r.suggestions,
        createdAt: r.created_at ? r.created_at.toISOString() : '',
      };
    }

    const data = await getAllMaterials('', '', 'all');
    const pending = data.filter(d => d.status === '待复刻');
    const allRep = data.flatMap(d => (d.replications || []).map(r => ({ ...r, inspName: d.name, visual: d.visual, hook: d.hook, psych: d.psychology })));

    // 统计每个视觉锤/心理标签的历史跑量率
    const visStats = {};
    const psychStats = {};
    const comboStats = {};
    allRep.forEach(r => {
      const v = (r.visual || '').trim();
      if (v) {
        if (!visStats[v]) visStats[v] = { total: 0, pao: 0, no: 0, totalLeads: 0, totalSpend: 0 };
        visStats[v].total++;
        if (r.effect === '跑量') visStats[v].pao++;
        if (r.effect === '无效果') visStats[v].no++;
        visStats[v].totalLeads += r.leads || 0;
        visStats[v].totalSpend += r.spend || 0;
      }
      (r.psych || '').split(/[,，、/|]/).map(s => s.trim()).filter(Boolean).forEach(p => {
        if (!psychStats[p]) psychStats[p] = { total: 0, pao: 0, no: 0, totalLeads: 0, totalSpend: 0 };
        psychStats[p].total++;
        if (r.effect === '跑量') psychStats[p].pao++;
        if (r.effect === '无效果') psychStats[p].no++;
        psychStats[p].totalLeads += r.leads || 0;
        psychStats[p].totalSpend += r.spend || 0;
      });
      if (v && r.psych) {
        r.psych.split(/[,，、/|]/).map(s => s.trim()).filter(Boolean).forEach(p => {
          const k = v + ' × ' + p;
          if (!comboStats[k]) comboStats[k] = { name: k, visual: v, psych: p, total: 0, pao: 0, totalLeads: 0, totalSpend: 0 };
          comboStats[k].total++;
          if (r.effect === '跑量') comboStats[k].pao++;
          comboStats[k].totalLeads += r.leads || 0;
          comboStats[k].totalSpend += r.spend || 0;
        });
      }
    });

    const suggestions = pending.map(d => {
      let score = 0;
      let reasons = [];
      let matchedCombos = [];

      // 检查视觉锤历史
      const vs = (d.visual || '').trim();
      if (vs && visStats[vs]) {
        const s = visStats[vs];
        const rate = s.total > 0 ? (s.pao / s.total) : 0;
        if (rate >= 0.5) { score += 3; reasons.push(`视觉锤「${vs}」历史跑量率 ${(rate*100).toFixed(0)}%`); }
        else if (rate > 0) { score += 1; reasons.push(`视觉锤「${vs}」有 ${s.pao} 次跑量记录`); }
        else if (s.no >= 2) { score -= 2; reasons.push(`⚠️ 视觉锤「${vs}」有 ${s.no} 次无效果记录`); }
        if (s.totalLeads > 0 && s.totalSpend > 0) {
          const cpl = Math.round(s.totalSpend / s.totalLeads);
          if (cpl < 500) { score += 2; reasons.push(`线索成本低（¥${cpl}/条）`); }
        }
      }

      // 检查心理标签
      const psyTags = (d.psychology || '').split(/[,，、/|]/).map(s => s.trim()).filter(Boolean);
      psyTags.forEach(p => {
        if (psychStats[p]) {
          const s = psychStats[p];
          const rate = s.total > 0 ? (s.pao / s.total) : 0;
          if (rate >= 0.5) { score += 2; reasons.push(`心理标签「${p}」跑量率 ${(rate*100).toFixed(0)}%`); }
          else if (rate > 0) { score += 1; reasons.push(`心理标签「${p}」有跑量记录`); }
        }
      });

      // 检查组合
      if (vs && psyTags.length) {
        psyTags.forEach(p => {
          const k = vs + ' × ' + p;
          if (comboStats[k]) {
            const c = comboStats[k];
            matchedCombos.push({ name: k, pao: c.pao, total: c.total, leads: c.totalLeads, spend: c.totalSpend });
            if (c.pao >= 1 && c.total > 0) {
              const rate = c.pao / c.total;
              if (rate >= 0.5) { score += 3; reasons.push(`组合「${k}」跑量率 ${(rate*100).toFixed(0)}%`); }
            }
          }
        });
      }

      // 衰减：采集太久未复刻
      if (d.date) {
        const days = Math.floor((Date.now() - new Date(d.date).getTime()) / 86400000);
        if (days > 30) score -= 1;
      }

      let level, color;
      if (score >= 5) { level = '高'; color = '#34C759'; }
      else if (score >= 2) { level = '中'; color = '#FF9500'; }
      else { level = '低'; color = '#FF3B30'; }

      return {
        id: d.id, name: d.name, visual: d.visual, hook: d.hook,
        psychology: d.psychology, brand: d.brand, category: d.category,
        date: d.date, note: d.note,
        score, level, color, reasons: reasons.slice(0, 3), matchedCombos: matchedCombos.slice(0, 3),
      };
    });

    suggestions.sort((a, b) => b.score - a.score);

    res.json({
      suggestions,
      aiSuggestion,
      visStats: Object.entries(visStats).map(([k, v]) => ({ name: k, ...v })).sort((a, b) => b.pao - a.pao).slice(0, 10),
      psychStats: Object.entries(psychStats).map(([k, v]) => ({ name: k, ...v })).sort((a, b) => b.pao - a.pao).slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ error: '获取建议失败: ' + err.message });
  }
});

// ================================================================
// 示例数据
// ================================================================

app.post('/api/materials/sample', async (req, res) => {
  try {
    await pool.query('DELETE FROM replications');
    await pool.query('DELETE FROM materials');

    const samples = [
      { name:'太阳能路灯-安装对比', link:'https://www.douyin.com/video/1', brand:'曜途', category:'路灯', visual:'安装前后对比（白天黑夜亮灯效果同屏对比）', hook:'农村道路别再摸黑走路了', psychology:'安全焦虑,价格敏感', status:'已验证', date:'2024-12-10', note:'对比强烈，开篇即抓住痛点', reps:[
        { link:'https://www.douyin.com/video/our1', spend:15800, impressions:960000, effect:'跑量', date:'2024-12-15', notes:'完全复刻对比结构，转化稳定' },
        { link:'https://www.douyin.com/video/our2', spend:7200, impressions:480000, effect:'一般', date:'2024-12-20', notes:'换了安装场景，效果差一些' }
      ]},
      { name:'反光路锥-暴力测试', link:'https://www.douyin.com/video/2', brand:'长和', category:'其他交安', visual:'暴力测试（车压+锤砸+日晒后复原对比）', hook:'这种路锥被车压了还能弹回来', psychology:'品质焦虑,踩坑恐惧', status:'已验证', date:'2024-12-09', note:'暴力测试类容易跑量，视觉冲击强', reps:[
        { link:'https://www.douyin.com/video/our3', spend:9600, impressions:610000, effect:'跑量', date:'2024-12-18', notes:'保持暴力测试风格，转化好' }
      ]},
      { name:'LED路灯-节能实测', link:'https://www.xiaohongshu.com/note/1', brand:'满天红', category:'路灯', visual:'数据展示（电费账单对比+亮度实测数据）', hook:'换了这批路灯，电费省了一半', psychology:'成本焦虑,从众心理', status:'已验证', date:'2024-12-08', note:'数据说话型内容，政府客户吃这套', reps:[
        { link:'https://www.xiaohongshu.com/note/our1', spend:18200, impressions:1300000, effect:'跑量', date:'2024-12-16', notes:'数据对比效果最好，持续复刻' }
      ]},
      { name:'减速带-承重实测', link:'https://www.xiaohongshu.com/note/2', brand:'鑫莹', category:'其他交安', visual:'承重实测（货车反复碾压+形变恢复特写）', hook:'这种减速带连货车都不怕', psychology:'品质焦虑,选择疲劳', status:'已验证', date:'2024-12-07', note:'工程实测风格，专业感强', reps:[
        { link:'https://www.xiaohongshu.com/note/our2', spend:10800, impressions:820000, effect:'跑量', date:'2024-12-14', notes:'实测内容持续跑量，客户信任度高' },
        { link:'https://www.xiaohongshu.com/note/our3', spend:4200, impressions:310000, effect:'无效果', date:'2024-12-22', notes:'改了开头话术后转化明显下降' }
      ]},
      { name:'防撞桶-道路施工场景', link:'', brand:'西北', category:'其他交安', visual:'施工场景实拍（防撞桶摆放+车辆避让画面）', hook:'道路施工这样摆才安全', psychology:'安全焦虑,专业认可', status:'待复刻', date:'2024-12-10', note:'场景类素材，工程老板喜欢看，尽快拍', reps:[] },
      { name:'庭院灯-小区案例', link:'', brand:'曜途', category:'路灯', visual:'小区实拍案例（多款庭院灯安装效果对比）', hook:'这个小区的灯，物业经理都说好', psychology:'从众心理,品质焦虑', status:'淘汰', date:'2024-12-06', note:'案例类拍摄成本高，先放一放', reps:[] },
    ];

    for (const s of samples) {
      const mid = 'm_' + uid();
      await pool.query(
        'INSERT INTO materials (id, link, name, brand, category, visual, hook, psychology, status, date, note) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [mid, s.link, s.name, s.brand, s.category, s.visual, s.hook, s.psychology, s.status, s.date, s.note]
      );
      for (const r of (s.reps || [])) {
        await pool.query(
          'INSERT INTO replications (id, material_id, link, spend, impressions, effect, notes, date) VALUES (?,?,?,?,?,?,?,?)',
          ['r_' + uid(), mid, r.link, r.spend, r.impressions, r.effect, r.notes, r.date]
        );
      }
    }
    res.json(await getAllMaterials('', '', 'all'));
  } catch (err) {
    res.status(500).json({ error: '加载示例失败: ' + err.message });
  }
});

// ================================================================
// 分析 API
// ================================================================

app.get('/api/analysis', async (req, res) => {
  try {
    const data = await getAllMaterials('', '', 'all');
    if (!data.length) return res.json({ metrics: { total:0, repCount:0, paoMian:0, daiFuKe:0 }, visual:[], psychology:[], combos:[], effCounts:{} });

    const total = data.length;
    const allRep = data.flatMap(d => (d.replications || []).map(r => ({ ...r, inspName: d.name, visual: d.visual, psych: d.psychology })));
    const repCount = allRep.length;
    const paoMian = data.filter(d => (d.replications || []).some(r => r.effect === '跑量')).length;
    const daiFuKe = data.filter(d => d.status === '待复刻').length;

    const effCounts = {};
    const totalLeads = allRep.reduce((s, r) => s + (r.leads||0), 0);
    const totalSpend = allRep.reduce((s, r) => s + (r.spend||0), 0);
    allRep.forEach(r => { effCounts[r.effect] = (effCounts[r.effect] || 0) + 1; });

    const visMap = {};
    allRep.forEach(r => {
      if (!r.visual) return;
      if (!visMap[r.visual]) visMap[r.visual] = { total: 0, 跑量: 0 };
      visMap[r.visual].total++;
      if (r.effect === '跑量') visMap[r.visual]['跑量']++;
    });
    const visual = Object.entries(visMap).map(([k, v]) => ({ name: k, total: v.total, pao: v['跑量'], rate: v.total > 0 ? ((v['跑量'] / v.total) * 100).toFixed(0) : 0 })).sort((a, b) => b.pao - a.pao);

    const psyMap = {};
    allRep.forEach(r => {
      if (!r.psych) return;
      r.psych.split(/[,，、/|]/).map(s => s.trim()).filter(Boolean).forEach(p => {
        if (!psyMap[p]) psyMap[p] = { total: 0, 跑量: 0 };
        psyMap[p].total++;
        if (r.effect === '跑量') psyMap[p]['跑量']++;
      });
    });
    const psychology = Object.entries(psyMap).map(([k, v]) => ({ name: k, total: v.total, pao: v['跑量'], rate: v.total > 0 ? ((v['跑量'] / v.total) * 100).toFixed(0) : 0 })).sort((a, b) => b.pao - a.pao);

    const comboMap = {};
    allRep.forEach(r => {
      const vs = r.visual || '';
      if (!vs || !r.psych) return;
      r.psych.split(/[,，、/|]/).map(s => s.trim()).filter(Boolean).forEach(p => {
        const k = vs + ' × ' + p;
        if (!comboMap[k]) comboMap[k] = { name: k, visual: vs, psych: p, total: 0, pao: 0 };
        comboMap[k].total++;
        if (r.effect === '跑量') comboMap[k].pao++;
      });
    });
    const combos = Object.values(comboMap).sort((a, b) => b.total - a.total).slice(0, 10);

    res.json({ metrics: { total, repCount, paoMian, daiFuKe, totalLeads, totalSpend }, visual, psychology, combos, effCounts, pending: data.filter(d => d.status === '待复刻').slice(0, 8) });
  } catch (err) {
    res.status(500).json({ error: '分析失败: ' + err.message });
  }
});

// ================================================================
// DeepSeek AI 分析
// ================================================================

app.post('/api/ai/analyze', async (req, res) => {
  try {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) return res.status(400).json({ error: 'DEEPSEEK_API_KEY 未配置' });

    const data = await getAllMaterials('', '', 'all');
    if (!data || !data.length) return res.status(400).json({ error: '没有数据' });

    const total = data.length;
    const allRep = data.flatMap(d => (d.replications || []).map(r => ({ ...r, name: d.name, visual: d.visual, psych: d.psychology })));
    const repCount = allRep.length;
    const paoCount = allRep.filter(r => r.effect === '跑量').length;
    const noCount = allRep.filter(r => r.effect === '无效果').length;

    const visCount = {};
    data.forEach(d => { const v = (d.visual || '').trim(); if (v) visCount[v] = (visCount[v] || 0) + 1; });
    const topVis = Object.entries(visCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}(${v}条)`).join('、');

    const psyCount = {};
    data.forEach(d => { (d.psychology || '').split(/[,，、/|]/).map(s => s.trim()).filter(Boolean).forEach(p => { psyCount[p] = (psyCount[p] || 0) + 1; }); });
    const topPsy = Object.entries(psyCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}(${v}条)`).join('、');

    let repSummary = '暂无复刻数据';
    if (repCount > 0) {
      const effMap = {};
      allRep.forEach(r => {
        const k = (r.visual || '未知') + ' × ' + (r.psych ? r.psych.split(/[,，、/|]/)[0].trim() : '未知');
        if (!effMap[k]) effMap[k] = { total: 0, pao: 0 };
        effMap[k].total++;
        if (r.effect === '跑量') effMap[k].pao++;
      });
      repSummary = Object.entries(effMap).sort((a, b) => b[1].pao - a[1].pao).slice(0, 8).map(([k, v]) => `${k}: 复刻${v.total}次/跑量${v.pao}次`).join('\n');
    }

    // 获取每条复刻的完整数据（含来源素材的全部字段）
    const [replDetails] = await pool.query(
      `SELECT r.link, r.spend, r.impressions, r.effect, r.notes, r.date,
              m.name AS insp_name, m.visual AS insp_visual, m.hook AS insp_hook,
              m.psychology AS insp_psychology, m.brand AS insp_brand, m.category AS insp_category
       FROM replications r
       JOIN materials m ON r.material_id = m.id
       ORDER BY r.created_at DESC`
    );

    let repDetailText = '暂无复刻记录';
    if (replDetails.length > 0) {
      repDetailText = replDetails.map(r =>
        `[${r.date || '无日期'}] 来源:「${r.insp_name}」| 品牌:${r.insp_brand||'-'} | 品类:${r.insp_category||'-'} | 视觉锤:${r.insp_visual||'-'} | 文案钩子:${r.insp_hook||'-'} | 心理标签:${r.insp_psychology||'-'} | 复刻效果:${r.effect} | 消耗:¥${parseFloat(r.spend)||0} | 展示:${r.impressions||0}${r.notes ? ' | 笔记:'+r.notes : ''}`
      ).join('\n');
    }

    // 获取待复刻灵感，给AI做拍摄建议
    const pending = data.filter(d => d.status === '待复刻');
    let pendingText = '暂无待复刻灵感';
    if (pending.length > 0) {
      pendingText = pending.map(d =>
        `- 「${d.name}」| 品牌:${d.brand||'-'} | 品类:${d.category||'-'} | 视觉锤:${d.visual||'-'} | 文案钩子:${d.hook||'-'} | 心理标签:${d.psychology||'-'} | 采集:${d.date||'-'}`
      ).join('\n');
    }

    const systemPrompt = `你是一个专业的投手策略分析师。职责是根据竞品素材的复刻追踪数据输出可执行的投放策略建议。

数据来源：团队搜集的竞品素材（视觉锤/文案钩子/心理标签），以及在抖音/快手等平台复刻投放后的效果数据。

每条复刻记录包含：
- 来源灵感名称、品牌、品类
- 来源灵感的视觉锤（画面特征）、文案钩子（开场话术）、心理标签（客户心理触发点）
- 复刻投放效果（跑量/一般/无效果）、消耗金额、展示量、获线索数、投手笔记

分析要求：
1. 评估当前素材库中哪些方向经过了数据验证——哪些视觉锤×心理标签的组合有实际跑量记录，结合消耗和线索成本判断性价比
2. 识别有潜力但尚未验证的方向，以及需要放弃的无效方向
3. 基于「待复刻灵感」列表和已验证的数据，给出具体的拍摄优先级建议——先拍哪个、后拍哪个、为什么
4. 如果有投手笔记中的发现，纳入分析

输出规范：
- 只陈述基于数据的事实和推论，不做情绪表达
- 每条结论附上数据依据
- 没有数据时不强行结论，说明数据不足即可
- 语言简洁、准确、中性，像一份分析报告
- 输出必须分为两大块：
  「## 📊 数据分析」：数据概况→已验证方向→待验证方向→放弃方向
  「## 🎯 拍摄建议」：基于待复刻灵感和历史数据，给出具体的拍摄优先级和理由`;

    const userPrompt = `## 数据概况

- 灵感总数：${total} 条
- 复刻总次数：${repCount} 次
- 跑量次数：${paoCount} 次
- 无效果次数：${noCount} 次

## 高频视觉锤
${topVis || '暂无'}

## 高频心理标签
${topPsy || '暂无'}

## 复刻效果最好的组合（视觉锤×心理标签）
${repSummary}

## 每条复刻的完整数据
${repDetailText}`;

    const reply = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], key);

    // 从回复中提取拍摄建议段落
    let suggestionsText = '';
    const suggestMatch = reply.match(/##\s*[🎯]*\s*拍摄建议[\s\S]*?(?=##|$)/);
    if (suggestMatch) {
      suggestionsText = suggestMatch[0].trim();
    } else {
      // 尝试找行动建议段落
      const actionMatch = reply.match(/##\s*[🎯]*\s*(行动建议|下一步)[\s\S]*?(?=##|$)/);
      if (actionMatch) suggestionsText = actionMatch[0].trim();
    }

    // 保存报告
    const reportId = 'ai_' + uid();
    const title = 'AI分析 ' + new Date().toISOString().slice(0, 10) + ' (' + replDetails.length + '条复刻)';
    await pool.query(
      'INSERT INTO ai_reports (id, title, content, suggestions, data_snapshot) VALUES (?,?,?,?,?)',
      [reportId, title, reply, suggestionsText, userPrompt]
    );

    res.json({ id: reportId, content: reply, createdAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function callDeepSeek(messages, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.7, max_tokens: 2048 });
    const url = new URL('https://api.deepseek.com/v1/chat/completions');
    const opts = {
      hostname: url.hostname, path: url.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey, 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) { try { resolve(JSON.parse(data).choices[0].message.content); } catch (e) { reject(new Error('解析响应失败: ' + e.message)); } }
        else { let e = 'DeepSeek API 错误 (' + res.statusCode + ')'; try { const j = JSON.parse(data); e += ': ' + (j.error?.message || data); } catch(ex) { e += ': ' + data; } reject(new Error(e)); }
      });
    });
    req.on('error', e => reject(new Error('请求失败: ' + e.message)));
    req.write(body);
    req.end();
  });
}



// ================================================================
// AI 报告管理 API
// ================================================================

app.get('/api/ai/reports', async (req, res) => {
  try {
    const [reports] = await pool.query(
      'SELECT id, title, created_at FROM ai_reports ORDER BY created_at DESC LIMIT 50'
    );
    res.json(reports.map(r => ({
      id: r.id, title: r.title,
      createdAt: r.created_at ? r.created_at.toISOString() : '',
    })));
  } catch (err) {
    res.status(500).json({ error: '查询失败: ' + err.message });
  }
});

app.get('/api/ai/reports/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ai_reports WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: '报告不存在' });
    const r = rows[0];
    res.json({
      id: r.id, title: r.title, content: r.content,
      suggestions: r.suggestions || '',
      dataSnapshot: r.data_snapshot || '',
      createdAt: r.created_at ? r.created_at.toISOString() : '',
    });
  } catch (err) {
    res.status(500).json({ error: '查询失败: ' + err.message });
  }
});

app.delete('/api/ai/reports/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ai_reports WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '删除失败: ' + err.message });
  }
});

// ================================================================
// 登录页 HTML
// ================================================================

function loginPage() {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>灵感库 · 登录</title><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Noto Sans SC',-apple-system,sans-serif;background:#F5F5F7;color:#1C1C1E;height:100vh;display:flex;align-items:center;justify-content:center}
.lp{background:#fff;border-radius:20px;box-shadow:0 8px 30px rgba(0,0,0,.08);padding:40px 36px;width:360px;max-width:90vw;text-align:center;animation:fadeIn .4s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
h1{font-size:1.3rem;font-weight:800;margin-bottom:4px}.sub{color:#8E8E93;font-size:.82rem;margin-bottom:28px}
.in{width:100%;padding:12px 16px;border:1.5px solid #E8E8ED;border-radius:12px;font-size:.92rem;font-family:inherit;outline:0;transition:.2s;margin-bottom:16px}
.in:focus{border-color:#007AFF;box-shadow:0 0 0 3px rgba(0,122,255,.12)}
.btn{width:100%;padding:13px;background:#007AFF;color:#fff;border:none;border-radius:12px;font-size:.92rem;font-weight:700;font-family:inherit;cursor:pointer;transition:.2s}
.btn:hover{background:#0066D6;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,122,255,.25)}
.err{color:#FF3B30;font-size:.8rem;margin-top:12px;display:none}
</style></head><body><div class="lp">
<h1>✨ 灵感库</h1><div class="sub">请输入密码继续</div>
<input type="password" class="in" id="pwd" placeholder="密码" onkeydown="if(event.key==='Enter')login()">
<button class="btn" onclick="login()">进入灵感库</button>
<div class="err" id="err">密码错误，请重试</div>
</div><script>
function login(){const p=document.getElementById('pwd').value;fetch('/inspiration/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p})}).then(r=>{if(r.ok)location.reload();else document.getElementById('err').style.display='block'}).catch(()=>document.getElementById('err').style.display='block')}
</script></body></html>`;
}

// ================================================================
// SPA fallback（已登录用户访问）
// ================================================================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✨ 灵感库已启动 → http://localhost:${PORT}`);
  if (APP_PASSWORD) console.log('   🔒 密码验证已开启');
  else console.log('   ⚠️  使用默认密码: admin123');
  if (process.env.DEEPSEEK_API_KEY) console.log('   🤖 DeepSeek AI 已就绪');
  console.log('   💾 数据存储: MySQL (inspiration_engine)');
});
