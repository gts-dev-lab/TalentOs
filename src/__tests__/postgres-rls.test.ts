/**
 * TT-117: Tests de Integración PostgreSQL + RLS
 * Verifica el aislamiento multi-tenant con PostgreSQL real:
 * - Conexión a PostgreSQL
 * - SET app.current_tenant_id funciona correctamente
 * - Queries sin SET devuelven 0 filas (RLS bloquea)
 * - Queries con SET devuelven solo datos del tenant correcto
 * 
 * @jest-environment node
 */

import { Pool } from 'pg';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

const SKIP_POSTGRES_TESTS = !TEST_DATABASE_URL;

const describePostgres = SKIP_POSTGRES_TESTS ? describe.skip : describe;
const describeNoPostgres = !SKIP_POSTGRES_TESTS ? describe.skip : describe;

describePostgres('TT-117: PostgreSQL + RLS Integration', () => {
  let pool: Pool;
  const tenantA = '00000000-0000-0000-0000-000000000001';
  const tenantB = '00000000-0000-0000-0000-000000000002';

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DATABASE_URL });
    
    await pool.query(`
      INSERT INTO public.tenants (id, name, slug)
      VALUES ($1, 'Tenant A', 'tenant-a')
      ON CONFLICT (id) DO NOTHING
    `, [tenantA]);
    
    await pool.query(`
      INSERT INTO public.tenants (id, name, slug)
      VALUES ($1, 'Tenant B', 'tenant-b')
      ON CONFLICT (id) DO NOTHING
    `, [tenantB]);
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  describe('Conexión y SET app.current_tenant_id', () => {
    it('establece correctamente app.current_tenant_id para tenant A', async () => {
      const client = await pool.connect();
      try {
        await client.query('SET app.current_tenant_id = $1', [tenantA]);
        
        const result = await client.query('SHOW app.current_tenant_id');
        expect(result.rows[0].app.current_tenant_id).toBe(tenantA);
      } finally {
        client.release();
      }
    });

    it('establece correctamente app.current_tenant_id para tenant B', async () => {
      const client = await pool.connect();
      try {
        await client.query('SET app.current_tenant_id = $1', [tenantB]);
        
        const result = await client.query('SHOW app.current_tenant_id');
        expect(result.rows[0].app.current_tenant_id).toBe(tenantB);
      } finally {
        client.release();
      }
    });

    it('cambia correctamente entre tenants', async () => {
      const client = await pool.connect();
      try {
        await client.query('SET app.current_tenant_id = $1', [tenantA]);
        let result = await client.query('SHOW app.current_tenant_id');
        expect(result.rows[0].app.current_tenant_id).toBe(tenantA);

        await client.query('SET app.current_tenant_id = $1', [tenantB]);
        result = await client.query('SHOW app.current_tenant_id');
        expect(result.rows[0].app.current_tenant_id).toBe(tenantB);
      } finally {
        client.release();
      }
    });
  });

  describe('RLS: Aislamiento entre tenants', () => {
    let testUserA: string;
    let testUserB: string;

    beforeAll(async () => {
      const client = await pool.connect();
      try {
        await client.query('SET app.current_tenant_id = $1', [tenantA]);
        const resultA = await client.query(`
          INSERT INTO public.users (tenant_id, name, email, role, status, department)
          VALUES ($1, 'User A', 'usera@test.com', 'employee', 'approved', 'IT')
          RETURNING id
        `, [tenantA]);
        testUserA = resultA.rows[0].id;

        await client.query('SET app.current_tenant_id = $1', [tenantB]);
        const resultB = await client.query(`
          INSERT INTO public.users (tenant_id, name, email, role, status, department)
          VALUES ($1, 'User B', 'userb@test.com', 'employee', 'approved', 'HR')
          RETURNING id
        `, [tenantB]);
        testUserB = resultB.rows[0].id;
      } finally {
        client.release();
      }
    });

    afterAll(async () => {
      const client = await pool.connect();
      try {
        await client.query('DELETE FROM public.users WHERE id IN ($1, $2)', [testUserA, testUserB]);
      } finally {
        client.release();
      }
    });

    it('RLS filtra usuarios sin SET (devuelve 0 filas)', async () => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM public.users');
        expect(result.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });

    it('RLS devuelve solo usuarios del tenant A', async () => {
      const client = await pool.connect();
      try {
        await client.query('SET app.current_tenant_id = $1', [tenantA]);
        
        const result = await client.query('SELECT * FROM public.users');
        expect(result.rows.length).toBe(1);
        expect(result.rows[0].email).toBe('usera@test.com');
        expect(result.rows[0].tenant_id).toBe(tenantA);
      } finally {
        client.release();
      }
    });

    it('RLS devuelve solo usuarios del tenant B', async () => {
      const client = await pool.connect();
      try {
        await client.query('SET app.current_tenant_id = $1', [tenantB]);
        
        const result = await client.query('SELECT * FROM public.users');
        expect(result.rows.length).toBe(1);
        expect(result.rows[0].email).toBe('userb@test.com');
        expect(result.rows[0].tenant_id).toBe(tenantB);
      } finally {
        client.release();
      }
    });

    it('impide acceso a datos de otro tenant directamente', async () => {
      const client = await pool.connect();
      try {
        await client.query('SET app.current_tenant_id = $1', [tenantA]);
        
        const result = await client.query(
          'SELECT * FROM public.users WHERE id = $1',
          [testUserB]
        );
        expect(result.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });
  });

  describe('RLS: Cursos y Matrículas', () => {
    let testCourseA: string;
    let testCourseB: string;

    beforeAll(async () => {
      const client = await pool.connect();
      try {
        await client.query('SET app.current_tenant_id = $1', [tenantA]);
        const resultA = await client.query(`
          INSERT INTO public.courses (tenant_id, title, description, status, instructor, duration, modality)
          VALUES ($1, 'Course A', 'Description A', 'published', 'Instructor A', '10h', 'Online')
          RETURNING id
        `, [tenantA]);
        testCourseA = resultA.rows[0].id;

        await client.query('SET app.current_tenant_id = $1', [tenantB]);
        const resultB = await client.query(`
          INSERT INTO public.courses (tenant_id, title, description, status, instructor, duration, modality)
          VALUES ($1, 'Course B', 'Description B', 'published', 'Instructor B', '5h', 'Online')
          RETURNING id
        `, [tenantB]);
        testCourseB = resultB.rows[0].id;
      } finally {
        client.release();
      }
    });

    afterAll(async () => {
      const client = await pool.connect();
      try {
        await client.query('DELETE FROM public.courses WHERE id IN ($1, $2)', [testCourseA, testCourseB]);
      } finally {
        client.release();
      }
    });

    it('RLS aísla cursos entre tenants', async () => {
      const client = await pool.connect();
      try {
        await client.query('SET app.current_tenant_id = $1', [tenantA]);
        const resultA = await client.query('SELECT * FROM public.courses');
        expect(resultA.rows.length).toBe(1);
        expect(resultA.rows[0].title).toBe('Course A');

        await client.query('SET app.current_tenant_id = $1', [tenantB]);
        const resultB = await client.query('SELECT * FROM public.courses');
        expect(resultB.rows.length).toBe(1);
        expect(resultB.rows[0].title).toBe('Course B');
      } finally {
        client.release();
      }
    });
  });

  describe('Errores sin tenant_id configurado', () => {
    it('lanza error si no hay tenant configurado', async () => {
      const client = await pool.connect();
      try {
        await client.query('RESET app.current_tenant_id');
        
        await expect(
          client.query('SELECT * FROM public.users')
        ).rejects.toThrow();
      } finally {
        client.release();
      }
    });
  });
});

describeNoPostgres('TT-117: PostgreSQL tests skipped', () => {
  it('requiere TEST_DATABASE_URL para ejecutar tests de PostgreSQL', () => {
    expect(true).toBe(true);
  });
});
