import express from 'express';
import path from 'path';
import pg from 'pg';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

function getDbConnectionString(): string {
  let url = (process.env.DATABASE_URL || '').trim();
  if (!url) {
    url = 'postgresql://neondb_owner:npg_WZKtsDw58CEc@ep-restless-paper-aclqi2hb-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
  }
  // Strip surrounding quotes
  url = url.replace(/^["']|["']$/g, '');
  // Strip channel_binding query param as node-postgres doesn't support SASL channel binding
  url = url.replace(/([?&])channel_binding=[^&]*&?/g, '$1').replace(/[?&]$/, '');
  return url;
}

const pool = new Pool({
  connectionString: getDbConnectionString(),
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('⚠️ Unexpected error on idle pg client:', err.message);
});

function cleanPhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

async function initDb() {
  let client;
  try {
    client = await pool.connect();
    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        nickname TEXT,
        phone TEXT UNIQUE NOT NULL,
        birthday TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'aluno',
        corda TEXT NOT NULL DEFAULT 'Crua',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Songs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        lyrics TEXT NOT NULL,
        video_url TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Toques Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS toques (
        id SERIAL PRIMARY KEY,
        instrument TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT,
        audio_url TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Events Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        event_date TEXT NOT NULL,
        location TEXT,
        description TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Event RSVPs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_rsvps (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        response TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (event_id, user_id)
      );
    `);

    // 6. Requests Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        user_nickname TEXT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pendente',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Messages Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        sender_name TEXT NOT NULL,
        sender_nickname TEXT,
        sender_role TEXT NOT NULL,
        receiver_id INTEGER,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure Admin User Exists
    const adminPhone = '41984842941';
    const adminRes = await client.query('SELECT * FROM users WHERE phone = $1', [adminPhone]);
    if (adminRes.rowCount === 0) {
      await client.query(
        `INSERT INTO users (name, nickname, phone, birthday, password, role, corda)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'Professor Mestre Admin',
          'Mestre Admin',
          adminPhone,
          '1985-01-01',
          '235689',
          'admin',
          'Vermelha',
        ]
      );
      console.log('✅ Admin user created successfully.');
    }

    // Seed sample data if songs table is empty
    const songsCheck = await client.query('SELECT COUNT(*) FROM songs');
    if (parseInt(songsCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO songs (title, author, lyrics, video_url) VALUES
        ('Paraná Ê', 'Domínio Público / Mestre Bimba',
         'Paraná ê, Paraná ê, Paraná!\n\nEu fui na Bahia e passei no mercado\nComprei um pandeiro e um berimbau\n\nParaná ê, Paraná ê, Paraná!\n\nVou jogar a capoeira, vou jogar na beira do mar\nQuem tem força tem mandinga, quem tem mandinga vai jogar\n\nParaná ê, Paraná ê, Paraná!\n\nParaná ê, Paraná ê, Paraná!',
         'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        ('Dona Maria Como Vai Você', 'Mestre Suassuna',
         'Dona Maria como vai você?\nEu vou pra Bahia pra ver a capoeira acontecer\n\nDona Maria como vai você?\nEu vou pra Bahia pra ver a capoeira acontecer\n\nA dona da casa é que sabe da lida\nPra fazer a moqueca com óleo de dorta\n\nDona Maria como vai você?\nEu vou pra Bahia pra ver a capoeira acontecer',
         'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        ('Lamento de Cativeiro', 'Mestre Toni Vargas',
         'Meu cativeiro, meu cativeiro...\nQuando o negro cantava o feitor dava de chibata\nHoje em dia o negro canta e o povo diz que é mulata!\n\nMeu cativeiro, meu cativeiro...\nAdeus meu cativeiro, adeus meus companheiros\nEu já vou me embora pra terra de bamba, pro meu terreiro!',
         'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      `);
    }

    // Seed sample data if toques table is empty
    const toquesCheck = await client.query('SELECT COUNT(*) FROM toques');
    if (parseInt(toquesCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO toques (instrument, title, description, video_url) VALUES
        ('berimbau', 'Toque de Angola', 'Ritmo lento e cadenciado, propício para o jogo baixo, manhoso e cheio de mandinga.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        ('berimbau', 'São Bento Grande de Regional', 'Toque rápido e dinâmico criado pelo Mestre Bimba para o jogo objetivo e veloz da Capoeira Regional.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        ('berimbau', 'Iúna', 'Toque solene reservado exclusivamente para o jogo entre Mestres e alunos graduados.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        ('pandeiro', 'Ritmada do Pandeiro de Angola', 'Batida clássica de pandeiro acompanhando o gunga e médio com variações e floreios.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        ('atabaque', 'Marcação de Atabaque para Roda', 'Toque ritmado que dita o pulso do coração da roda de capoeira.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        ('agogo', 'Toque Duplo de Agogô', 'Ritmo metálico marcante para acompanhamento nas rodas de angola e regional.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        ('cuia', 'Preparo e afinação da Cuia', 'Instruções de manutenção, cabaça e afinação do Berimbau.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      `);
    }

    // Seed sample data if events table is empty
    const eventsCheck = await client.query('SELECT COUNT(*) FROM events');
    if (parseInt(eventsCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO events (title, event_date, location, description) VALUES
        ('Roda Aberta de Sexta-Feira', '2026-08-20T19:00', 'Academia Central de Capoeira', 'Roda aberta para todos os alunos e convidados especiais de outros grupos. Traje completo.'),
        ('Batizado e Troca de Cordas 2026', '2026-09-15T14:00', 'Ginásio Municipal Esportivo', 'Grande evento anual de formatura, batizado e troca de graduações com a presença de Mestres convidados.'),
        ('Aulão de Ritmos e Instrumentos', '2026-08-28T10:00', 'Sede do Grupo', 'Workshop prático de confecção de afinação de berimbau e treino intensivo de cânticos.');
      `);
    }

    console.log('✅ Database initialized successfully.');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  } finally {
    if (client) client.release();
  }
}

let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

async function ensureDbInit(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!dbInitialized) {
    try {
      if (!dbInitPromise) {
        dbInitPromise = initDb();
      }
      await dbInitPromise;
      dbInitialized = true;
    } catch (err) {
      dbInitPromise = null;
      console.error('❌ Error initializing database on request:', err);
    }
  }
  next();
}

const app = express();
app.use(express.json());
app.use('/api', ensureDbInit);

// API ROUTES

  // Auth: Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { phone, password } = req.body;
      const cleanP = cleanPhone(phone);

      if (!cleanP || !password) {
        return res.status(400).json({ error: 'Telefone e senha são obrigatórios.' });
      }

      const result = await pool.query(
        'SELECT id, name, nickname, phone, birthday, role, corda, created_at FROM users WHERE phone = $1 AND password = $2',
        [cleanP, password]
      );

      if (result.rowCount === 0) {
        return res.status(401).json({ error: 'Telefone ou senha inválidos.' });
      }

      res.json({ user: result.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth: Register (New Aluno)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, nickname, phone, birthday, password } = req.body;
      const cleanP = cleanPhone(phone);

      if (!name || !cleanP || !password) {
        return res.status(400).json({ error: 'Nome, telefone e senha são obrigatórios.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
      }

      // Check if phone already registered
      const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [cleanP]);
      if (existing.rowCount && existing.rowCount > 0) {
        return res.status(400).json({ error: 'Este número de telefone já está cadastrado.' });
      }

      const result = await pool.query(
        `INSERT INTO users (name, nickname, phone, birthday, password, role, corda)
         VALUES ($1, $2, $3, $4, $5, 'aluno', 'Crua (Iniciante)')
         RETURNING id, name, nickname, phone, birthday, role, corda, created_at`,
        [name, nickname || name, cleanP, birthday || '', password]
      );

      res.status(201).json({ user: result.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Users: List (Admin / Professor or Dashboard summary)
  app.get('/api/users', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, name, nickname, phone, birthday, role, corda, created_at FROM users ORDER BY name ASC'
      );
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Users: Create by Admin/Professor
  app.post('/api/users', async (req, res) => {
    try {
      const { name, nickname, phone, birthday, password, role, corda } = req.body;
      const cleanP = cleanPhone(phone);

      if (!name || !cleanP || !password) {
        return res.status(400).json({ error: 'Nome, telefone e senha são obrigatórios.' });
      }

      const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [cleanP]);
      if (existing.rowCount && existing.rowCount > 0) {
        return res.status(400).json({ error: 'Telefone já cadastrado.' });
      }

      const result = await pool.query(
        `INSERT INTO users (name, nickname, phone, birthday, password, role, corda)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, nickname, phone, birthday, role, corda, created_at`,
        [name, nickname || name, cleanP, birthday || '', password, role || 'aluno', corda || 'Crua (Iniciante)']
      );

      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Users: Update
  app.put('/api/users/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const { name, nickname, phone, birthday, role, corda, password } = req.body;
      const cleanP = cleanPhone(phone);

      let query = `
        UPDATE users
        SET name = $1, nickname = $2, phone = $3, birthday = $4, role = $5, corda = $6
      `;
      let params = [name, nickname, cleanP, birthday, role, corda];

      if (password && password.trim().length >= 6) {
        query += `, password = $7 WHERE id = $8 RETURNING id, name, nickname, phone, birthday, role, corda`;
        params.push(password, id);
      } else {
        query += ` WHERE id = $7 RETURNING id, name, nickname, phone, birthday, role, corda`;
        params.push(id);
      }

      const result = await pool.query(query, params);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Users: Delete
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      res.json({ message: 'Usuário removido com sucesso.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Songs: Get all
  app.get('/api/songs', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM songs ORDER BY id DESC');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Songs: Create
  app.post('/api/songs', async (req, res) => {
    try {
      const { title, author, lyrics, video_url, created_by } = req.body;
      if (!title || !lyrics) {
        return res.status(400).json({ error: 'Nome da música e letra são obrigatórios.' });
      }

      const result = await pool.query(
        `INSERT INTO songs (title, author, lyrics, video_url, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [title, author || 'Desconhecido', lyrics, video_url || '', created_by || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Songs: Update
  app.put('/api/songs/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const { title, author, lyrics, video_url } = req.body;

      const result = await pool.query(
        `UPDATE songs
         SET title = $1, author = $2, lyrics = $3, video_url = $4
         WHERE id = $5 RETURNING *`,
        [title, author, lyrics, video_url, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Música não encontrada.' });
      }

      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Songs: Delete
  app.delete('/api/songs/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const result = await pool.query('DELETE FROM songs WHERE id = $1 RETURNING id', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Música não encontrada.' });
      }
      res.json({ message: 'Música excluída com sucesso.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Toques: Get all
  app.get('/api/toques', async (req, res) => {
    try {
      const instrument = req.query.instrument;
      let query = 'SELECT * FROM toques';
      let params: any[] = [];
      if (instrument) {
        query += ' WHERE instrument = $1';
        params.push(instrument);
      }
      query += ' ORDER BY id DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Toques: Create
  app.post('/api/toques', async (req, res) => {
    try {
      const { instrument, title, description, video_url, audio_url, created_by } = req.body;
      if (!instrument || !title) {
        return res.status(400).json({ error: 'Instrumento e título são obrigatórios.' });
      }

      const result = await pool.query(
        `INSERT INTO toques (instrument, title, description, video_url, audio_url, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [instrument, title, description || '', video_url || '', audio_url || '', created_by || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Toques: Update
  app.put('/api/toques/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const { instrument, title, description, video_url, audio_url } = req.body;

      const result = await pool.query(
        `UPDATE toques
         SET instrument = $1, title = $2, description = $3, video_url = $4, audio_url = $5
         WHERE id = $6 RETURNING *`,
        [instrument, title, description, video_url, audio_url, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Toque não encontrado.' });
      }

      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Toques: Delete
  app.delete('/api/toques/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const result = await pool.query('DELETE FROM toques WHERE id = $1 RETURNING id', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Toque não encontrado.' });
      }
      res.json({ message: 'Toque excluído com sucesso.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Events: Get all with RSVP summaries & details
  app.get('/api/events', async (req, res) => {
    try {
      const userId = req.query.user_id ? parseInt(req.query.user_id as string, 10) : null;

      const eventsResult = await pool.query('SELECT * FROM events ORDER BY event_date ASC');
      const events = eventsResult.rows;

      for (const ev of events) {
        const rsvpsResult = await pool.query(
          `SELECT r.id, r.event_id, r.user_id, r.response, r.updated_at,
                  u.name as user_name, u.nickname as user_nickname, u.corda as user_corda
           FROM event_rsvps r
           JOIN users u ON u.id = r.user_id
           WHERE r.event_id = $1`,
          [ev.id]
        );

        const rsvps = rsvpsResult.rows;
        ev.rsvps = rsvps;

        ev.counts = {
          vou: rsvps.filter(r => r.response === 'vou').length,
          nao_sei: rsvps.filter(r => r.response === 'nao_sei').length,
          nao_vou: rsvps.filter(r => r.response === 'nao_vou').length,
        };

        if (userId) {
          const myRsvp = rsvps.find(r => r.user_id === userId);
          ev.user_rsvp = myRsvp ? myRsvp.response : null;
        }
      }

      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Events: Create
  app.post('/api/events', async (req, res) => {
    try {
      const { title, event_date, location, description, created_by } = req.body;
      if (!title || !event_date) {
        return res.status(400).json({ error: 'Título e data do evento são obrigatórios.' });
      }

      const result = await pool.query(
        `INSERT INTO events (title, event_date, location, description, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [title, event_date, location || '', description || '', created_by || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Events: Update
  app.put('/api/events/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const { title, event_date, location, description } = req.body;

      const result = await pool.query(
        `UPDATE events
         SET title = $1, event_date = $2, location = $3, description = $4
         WHERE id = $5 RETURNING *`,
        [title, event_date, location, description, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Evento não encontrado.' });
      }

      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Events: Delete
  app.delete('/api/events/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Evento não encontrado.' });
      }
      res.json({ message: 'Evento excluído com sucesso.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Events: RSVP
  app.post('/api/events/:id/rsvp', async (req, res) => {
    try {
      const eventId = req.params.id;
      const { user_id, response } = req.body;

      if (!user_id || !['vou', 'nao_sei', 'nao_vou'].includes(response)) {
        return res.status(400).json({ error: 'Dados de confirmação inválidos.' });
      }

      const result = await pool.query(
        `INSERT INTO event_rsvps (event_id, user_id, response, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (event_id, user_id)
         DO UPDATE SET response = EXCLUDED.response, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [eventId, user_id, response]
      );

      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Requests: Get all (or filtered by user)
  app.get('/api/requests', async (req, res) => {
    try {
      const userId = req.query.user_id ? parseInt(req.query.user_id as string, 10) : null;
      let query = 'SELECT * FROM requests';
      let params: any[] = [];
      if (userId) {
        query += ' WHERE user_id = $1';
        params.push(userId);
      }
      query += ' ORDER BY id DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Requests: Create
  app.post('/api/requests', async (req, res) => {
    try {
      const { user_id, user_name, user_nickname, type, title, description } = req.body;
      if (!user_id || !type || !title) {
        return res.status(400).json({ error: 'Tipo e título da solicitação são obrigatórios.' });
      }

      const result = await pool.query(
        `INSERT INTO requests (user_id, user_name, user_nickname, type, title, description)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [user_id, user_name, user_nickname || user_name, type, title, description || '']
      );

      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Requests: Update status or notes by Admin
  app.put('/api/requests/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const { status, admin_notes } = req.body;

      const result = await pool.query(
        `UPDATE requests
         SET status = COALESCE($1, status), admin_notes = COALESCE($2, admin_notes)
         WHERE id = $3 RETURNING *`,
        [status, admin_notes, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Solicitação não encontrada.' });
      }

      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Requests: Delete
  app.delete('/api/requests/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const result = await pool.query('DELETE FROM requests WHERE id = $1 RETURNING id', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Solicitação não encontrada.' });
      }
      res.json({ message: 'Solicitação excluída.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Messages / Chat: Get list
  app.get('/api/messages', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM messages ORDER BY id ASC LIMIT 200');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Messages: Send
  app.post('/api/messages', async (req, res) => {
    try {
      const { sender_id, sender_name, sender_nickname, sender_role, receiver_id, text } = req.body;
      if (!sender_id || !text || !text.trim()) {
        return res.status(400).json({ error: 'Mensagem inválida.' });
      }

      const result = await pool.query(
        `INSERT INTO messages (sender_id, sender_name, sender_nickname, sender_role, receiver_id, text)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [sender_id, sender_name, sender_nickname || sender_name, sender_role || 'aluno', receiver_id || null, text.trim()]
      );

      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 404 handler for unmatched /api routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Rota de API não encontrada.' });
  });

// Global Express Error Handler for API routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('⚠️ Server API Error:', err);
  res.status(500).json({ error: err?.message || 'Erro interno no servidor.' });
});

// Standalone server starter (only executed in local dev environment, skipped in Vercel Serverless Functions)
async function startLocalServer() {
  const PORT = process.env.PORT || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(` Capoeira App Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startLocalServer();
}

export default app;
