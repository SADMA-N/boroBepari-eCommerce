
import { webcrypto } from 'node:crypto';
import { Client } from 'pg';

const SECRET = process.env.ADMIN_AUTH_SECRET || 'admin-secret-key-change-in-production';
const DATABASE_URL = 'postgresql://postgres:postgres@localhost:54322/postgres';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SECRET);
  // Use webcrypto from 'crypto' module for Node compatibility if global crypto is not available
  const subtle = webcrypto.subtle;
  const hashBuffer = await subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function fixAdmin() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const email = 'admin@borobepari.com';
    const newPassword = 'password123';
    const hashedPassword = await hashPassword(newPassword);

    console.log(`Resetting password for ${email}...`);

    const result = await client.query(
      `UPDATE admins SET password = $1, is_active = true WHERE email = $2 RETURNING id`,
      [hashedPassword, email]
    );

    if (result.rowCount === 0) {
      console.log('Admin user not found. Creating one...');
      // Create if doesn't exist
      const id = crypto.randomUUID();
      await client.query(
        `INSERT INTO admins (id, email, password, name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, email, hashedPassword, 'Super Admin', 'super_admin', true]
      );
      console.log('Admin user created.');
    } else {
      console.log('Admin password updated.');
    }

    console.log('\n---------------------------------------------------\n');
    console.log('Admin credentials updated successfully!');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log(`2FA Code: 123456 (Default)`);
    console.log('---------------------------------------------------\n');

  } catch (err) {
    console.error('Error updating admin:', err);
  } finally {
    await client.end();
  }
}

fixAdmin();
